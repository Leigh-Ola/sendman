import { fetchUsers, fetchContacts } from "../requests.mjs";

let contacts = [];

async function newChat(url, params) {
  console.log("starting new chat: %o", params);
  const authtoken = localStorage.getItem("authtoken");
  return new Promise((resolve, reject) => {
    axios
      .post(url, params, {
        validateStatus: (status) => {
          return status < 600;
        },
        headers: { Authorization: "Bearer " + authtoken },
      })
      .then((res) => {
        // console.log(res);
        let status = res.status;
        if (status > 299) {
          console.log("failed");
          return reject(res.data);
        }
        console.log("succeeded");
        resolve(res.data);
      })
      .catch((e) => {
        console.log("failed");
        reject("An unknown error occurred. Please try again");
      });
  });
}

var data = {
  data: function () {
    return {
      members: [],
      right: false,
      temp_query: "",
      query: "",
      temp_grpname: "",
      grpname: "",
      q_err: "",
      g_err: "",
      searching: false,
      is_contacts: true,
      users: [],
      loading: false,
    };
  },
  mounted: async function () {
    let con = await fetchContacts();
    contacts = con;
    for (let c in con) {
      this.$set(this.users, Number(c), con[c]);
    }
  },
  watch: {
    temp_query: function (temp) {
      var err = "Query is too short";
      if (temp.length > 2) {
        err = "Query is too long";
        if (temp.length <= 25) {
          this.query = temp;
          this.q_err = "";
          return;
        }
      }
      this.q_err = err;
    },
    temp_grpname: function (temp) {
      var err = "Group name is too short";
      if (temp.length > 3) {
        err = "Group name is too long";
        if (temp.length <= 20) {
          err = "Group name contains invalid characters";
          if (!/[^a-zA-Z0-9_\-\s]/g.test(temp)) {
            this.grpname = temp;
            this.g_err = "";
            return;
          }
        }
      }
      this.g_err = err;
    },
  },
  computed: {
    is_group: function () {
      return this.members.length <= 1 ? false : true;
    },
    allGood: function () {
      if (this.is_group) {
        if (this.g_err != "" || this.grpname == "") {
          return false;
        }
      }
      return this.members.length > 0;
    },
  },
  methods: {
    search: async function (e) {
      if (this.q_err || !this.query) {
        return;
      }
      this.users = [];
      this.searching = true;
      let query = this.query.toLowerCase();
      let raw_users = await fetchUsers(query);
      this.users = raw_users;
      this.is_contacts = false;
      this.searching = false;
    },
    toggleMember: function (user) {
      let members = this.members;
      let rem = false;
      for (let k in members) {
        if (user.id == members[k].id) {
          this.$delete(this.members, k);
          rem = true;
        }
      }
      if (!rem) {
        this.members.push(user);
      }
    },
    checkMember: function (id) {
      for (let user of this.members) {
        if (user.id == id) {
          return true;
        }
      }
      return false;
    },
    checkRight: function () {
      if (this.grpname && !this.g_err) {
        this.right = true;
      }
    },
    done: async function () {
      if (!this.allGood || this.loading) {
        return;
      }
      this.loading = true;

      if (this.members.length > 1) {
        await newChat("/newchat/group", {
          id: this.members.map((v) => v.id),
          name: this.grpname,
        }).catch((e) => {
          e = typeof e == "string" ? e : "Unknown Error. Please try again";
          this.g_err = e;
        });
      } else {
        await newChat("/newchat/private", {
          id: this.members[0].id,
        }).catch((e) => {
          e = typeof e == "string" ? e : "Unknown Error. Please try again";
          this.g_err = e;
        });
      }
      if (this.g_err) {
        this.loading = false;
        this.right = true;
        return;
      }

      let orig = {
        members: [],
        right: false,
        temp_query: "",
        query: "",
        temp_grpname: "",
        grpname: "",
        q_err: "",
        g_err: "",
        searching: false,
        users: contacts,
        loading: false,
      };
      for (let k in orig) {
        this[k] = orig[k];
      }
      this.close();
    },
    close: function () {
      this.$emit("close");
    },
  },
  template: `
        <div class="asidebox show">
          <aside>
            <header>
              <div v-if="is_group">Create a group</div>
              <div v-else>Send Files</div>
              <i class="fa fa-chevron-down" @click.stop="close()"></i>
            </header>
            <form class="inputbox" action="/" @submit.prevent="search(event)">
              <input
                type="text"
                id="search"
                placeholder="Username, Email or Number"
                v-model="temp_query"
              />
              <i class="icon fa fa-search" @click="search()"></i>
            </form>
            <div class="count">
              <span v-for="user in members">{{user.username}}</span>
            </div>
            <div class="contactsbox">
              <div class="contact"  v-for="user in users"
                @click="toggleMember(user)">
                <img :src="user.image" alt="Contact Image" />
                <div>
                  <b>{{user.username}} <i></i></b>
                  <span class="fa fa-check" v-if="checkMember(user.id)"></span>
                </div>
              </div>
              <div class="none" v-if="!users || !users.length">{{searching? 'Searching...' : is_contacts? 'No Contacts' : 'No results'}}</div>
            </div>
            
            <label for="name">{{q_err? q_err : g_err}}</label>
            <div class="nextbox" 
              :class="[is_group && !right ? 'isgroup' : '']"
            >
              <div class='grpname'>
                <input 
                  type='text' placeholder="Group Name"
                  v-model="temp_grpname" class='name'
                />
                <span @click="checkRight()"><i class='fa fa-chevron-right'></i></span>
              </div>
              <button class="start" @click="done()"
                :class="[allGood? '' : 'inactive']"
              >
                <div class="loading" v-if="loading">
                  <span>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                </div>
                {{is_group? 'Create Group' : 'Send Files'}}
              </button>
            </div>
          </aside>
        </div>`,
};

export { data as template };
