// vue templates
import { template as t_message } from "./templates/messages.mjs";
import { template as t_user } from "./templates/users.mjs";
import { template as t_new_conversation } from "./templates/newconversation.mjs";
import { template as t_profile } from "./templates/profile.js";

// helper functions
import { fetchChats, fetchTransfers, fetchSelfData } from "./requests.mjs";
import { utilities } from "./utilities.js";
import { Recurrent } from "./recurrent.mjs";
import { Notif } from "./notification.mjs";

const Notify = Notif();

const Recur = Recurrent(3000);
new Vue({
  el: "#app",
  data: {
    showaside: false,
    darkmode: false,
    newc_popup: false,
    showrename: false,
    showprofile: false,
    showNotif: false,
    loadingUsers: true,
    loadingMessages: true,
    inArchive: false,
    initializing: true,
    active_user_id: "",
    filter: "",
    show_f_err: false,
    updatingContacts: false,
    contacts: [],
    messages: [],
    fnError: false,
    rename: "",
    fileData: {
      lastModified: 0,
      error: "",
      name: "",
      size: 0,
      file: undefined,
      reset: false,
      progress: 0,
      cancelled: false,
    },
  },
  components: {
    "v-message": t_message,
    "v-user": t_user,
    "v-new-conversation": t_new_conversation,
    "v-profile": t_profile,
  },
  mounted: function () {
    updateContacts.apply(this);
    // handleFileUpload.apply(this);
    // Recur.add({
    //   updateMessages: [updateMessages, this],
    //   updateContacts: [updateContacts, this]
    // });
    document
      .getElementsByClassName("sendfile")[0]
      .addEventListener("click", () => {
        this.submitFile();
      });
    fetchSelfData("darkmode")
      .then((val) => {
        val = String(val) == "true";
        this.darkmode = val;
      })
      .catch((e) => {});
    if (Notify.Notify.needsPermission) {
      // show notification permission request box
      this.showNotif = true;
    }
  },
  watch: {
    inArchive: function () {
      this.loadingMessages = true;
      this.loadingUsers = true;
    },
    fnError: function (val) {
      let el = Sizzle.matches("#rename")[0];
      if (val) {
        el.classList.add("error");
        this.rename = "";
        el.placeholder = "Invalid file name";
      } else {
        el.classList.remove("error");
        el.placeholder = "Rename your file";
      }
    },
    filter: function (c, v) {
      if (!c || !v) {
        this.show_f_err = true;
      }
    },
  },
  computed: {
    croppedFileName: function () {
      let name = this.fileData.name;
      return name ? utilities.cropText(name, 25) : "";
    },
    active_user_name: function () {
      if (this.active_user_id == "") {
        return "";
      }
      for (var k in this.contacts) {
        if (this.contacts[k].id == this.active_user_id) {
          let user = this.contacts[k];

          return user.type == "group" ? user.groupname : user.username;
        }
      }
    },
    active_user_index: function () {
      for (let k in this.contacts) {
        if (this.contacts[k].id == this.active_user_id) {
          return Number(k);
        }
      }
      return 0;
    },
    active_user: function () {
      return this.contacts[this.active_user_index] || {};
    },
    f_err: function () {
      let filter = this.filter;
      var err = "Query is too short";
      if (filter.length > 2 || filter == "") {
        err = "Query is too long";
        if (filter.length <= 20) {
          return "";
        }
      }
      return err;
    },
  },
  methods: {
    renameFile: function () {
      if (!this.showrename) {
        this.showrename = true;
        return;
      }
      let fileEl = Sizzle.matches("#file")[0];
      if (!fileEl.files.length) {
        this.showrename = false;
        return;
      }
      let file = fileEl.files[0];
      let newname = this.rename;
      let oldname = this.fileData.name;
      if (!/^[A-Za-z0-9\s_\+\-\.]+$/g.test(newname)) {
        this.fnError = true;
        return;
      } else {
        this.fnError = false;
      }
      oldname = utilities.parseFileName(oldname);
      newname = `${newname}.${oldname.extension}`;
      this.fileData.name = newname;
      this.showrename = false;
    },
    submitFile: function () {
      if (!this.fileData.size || this.fileData.progress > 0) {
        return;
      }
      let formData = new FormData();
      formData.append(this.fileData.name, this.fileData.file);
      formData.append("type", this.active_user.type);
      formData.append("chatId", this.active_user.chatId);
      // ^ You can add any data to be sent, including strings

      this.$set(this.fileData, "error", "");
      this.$set(this.fileData, "sending", true);
      this.$set(this.fileData, "reset", true);
      let cancelTokenSource = axios.CancelToken.source();

      axios
        .post("/upload/file", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          cancelToken: cancelTokenSource.token,
          onUploadProgress: (progEv) => {
            if (this.fileData.cancelled) {
              cancelTokenSource.cancel();
            } else {
              let cent = Number(
                Math.round((progEv.loaded / progEv.total) * 100)
              );
              this.fileData.progress = cent;
            }
          },
        })
        .then(() => {
          console.log(`Sent ${this.fileData.name}`);
        })
        .catch((e) => {
          console.log(`Unable to send ${this.fileData.name} : ${e}`);
          console.log(e.response);
          this.fileData.error = this.fileData.cancelled
            ? "Upload Cancelled"
            : "An error occurred";
        })
        .finally(() => {
          console.log("completed");
          this.$set(this.fileData, "cancelled", false);
          if (!this.fileData.error) {
            this.$set(this.fileData, "lastModified", 0);
            this.$set(this.fileData, "name", "");
            this.$set(this.fileData, "size", 0);
            this.$set(this.fileData, "file", undefined);
            this.$set(this.fileData, "sending", false);
            this.$set(this.fileData, "progress", 0);
            this.$set(this.fileData, "error", "");
          }
          let el = Sizzle.matches("#file")[0];
          el.value = "";
        });
    },

    cancelUpload: function () {
      if (this.fileData.sending && !this.fileData.error) {
        console.log("x");
        this.fileData.cancelled = true;
      } else {
        console.log("y");
        this.fileData.cancelled = false;
        this.$set(this.fileData, "error", "");
        this.$set(this.fileData, "lastModified", 0);
        this.$set(this.fileData, "name", "");
        this.$set(this.fileData, "size", 0);
        this.$set(this.fileData, "file", undefined);
        this.$set(this.fileData, "progress", 0);
        this.$set(this.fileData, "sending", false);
        let el = Sizzle.matches("#file")[0];
        el.value = "";
      }
    },

    switchUser: function (id) {
      this.loadingMessages = true;
      this.active_user_id = id;
      Recur.remove("updateMessages");
      updateMessages.apply(this);
      Recur.add({
        updateMessages: [updateMessages, this],
      });
    },

    updateContacts: function (query) {
      this.show_f_err = true;
      this.loadingMessages = true;
      Recur.remove("updateContacts");
      Recur.remove("updateMessages");
      updateContacts.apply(this, [query]);
      updateMessages.apply(this);
      Recur.add({
        updateContacts: [updateContacts, this, query],
        updateMessages: [updateMessages, this],
      });
    },

    removeTransfer: function (fileId) {
      let messages = this.messages;
      for (let i in this.messages) {
        if (messages[i].fileId == fileId) {
          this.$delete(messages, i);
          Recur.remove("updateMessages");
          updateMessages.apply(this);
          Recur.add({
            updateMessages: [updateMessages, this],
          });
          break;
        }
      }
    },

    toggleArchive: function () {
      if (!this.loadingUsers) {
        this.inArchive = !this.inArchive;
      }
    },

    pinChat: function (chatId) {
      let key = 0;
      for (let k in this.contacts) {
        if (this.contacts[k].chatId == chatId) {
          key = Number(k);
        }
      }
      let contact = this.contacts.slice(key, key + 1);
      console.log(contact);
      this.$delete(this.contacts, key);
      this.contacts.unshift(contact);
    },

    firstFile: function () {
      if (!this.contacts.length) {
        this.showaside = true;
        this.newc_popup = true;
      } else {
        Sizzle.matches("#file")[0].click();
      }
    },

    logoClick: function () {
      Notify.initialize();
      this.showNotif = false;
    },
  },
});

// Additional Functions

function handleFileUpload() {
  setInterval(() => {
    if (this.fileData.sending || this.fileData.cancelled) {
      return;
    }
    if (this.fileData.reset) {
      this.$set(this.fileData, "reset", false);
      return;
    }
    let el = Sizzle.matches("#file")[0];
    if (el.files.length == 0) {
      return;
    }
    var file = el.files[0];
    if (
      this.fileData.lastModified == file.lastModified ||
      file.size == 0 ||
      this.fileData.progress != 0
    ) {
      return;
    }
    //console.log("Change Detected...handling...");
    //console.log(JSON.stringify(this.fileData));
    this.fileData.lastModified = file.lastModified;
    this.fileData.file = file;
    this.fileData.name = file.name;
    this.fileData.size = file.size;
    this.fnError = false;
    this.rename = utilities.parseFileName(file.name).name;
  }, 500);
}

async function updateContacts(q) {
  if (q && this.f_err) {
    return;
  }
  // console.log(`Fetching chats : '${q}'`);
  if (this.contacts.length) {
    // return;
  }
  let data = await fetchChats(q ? q : "", this.inArchive);
  // console.log(data);
  if (String(data.constructor).indexOf("bject") > -1) {
    if (data.unauthorized) {
      console.log("unauthorized");
      window.location.href = "/login";
      return;
    }
  }
  if (data instanceof Array) {
    this.initializing = false;
    data = utilities.sortByPinned(data);
  }
  let foundId = false;
  this.contacts = [];
  for (let key = 0; key < data.length; key++) {
    let val = data[key];
    val.time = utilities.passedTime(val.time);
    if (val.id == this.active_user_id) {
      foundId = true;
    }
    this.$set(this.contacts, key, val);
  }
  // console.log(this.contacts);
  if (this.loadingUsers == true && this.contacts.length) {
    this.active_user_id = this.contacts[0].id;
    this.switchUser(this.active_user_id);
  } else if (this.contacts.length && !foundId) {
    this.active_user_id = this.contacts[0].id;
  }
  this.loadingUsers = false;
}

async function updateMessages() {
  if (!this.contacts.length || this.loadingUsers) {
    this.messages = [];
  }
  if (!this.active_user.chatId) {
    this.loadingMessages = false;
    return;
  }
  let transfers = await fetchTransfers(this.active_user.chatId);
  // console.log(transfers);
  if (String(transfers.constructor).indexOf("bject") > -1) {
    if (transfers.unauthorized) {
      console.log("unauthorized");
      window.location.href = "/login";
      return;
    }
  }
  this.messages = [];
  transfers.forEach((v, i) => {
    this.$set(this.messages, i, v);
  });
  this.loadingMessages = false;
  this.$nextTick(() => {
    let parent = Sizzle.matches(".chatbox")[0];
    let children = Sizzle.matches(".chatbox .msgline");
    if (!children || !children.length) {
      return;
    }
    let lastChild = children[children.length - 1];
    parent.scrollTop = lastChild.offsetTop;
  });
}
