import { template as v_username } from "./templates/username.mjs";
import { template as v_bio } from "./templates/bio.mjs";
import { template as v_emails } from "./templates/emails.mjs";
import { template as v_numbers } from "./templates/numbers.mjs";
import { template as v_password } from "./templates/password.mjs";
import { template as v_privacy } from "./templates/privacy.mjs";
import { template as v_darkmode } from "./templates/darkmode.mjs";

// seed data
// import seed from "./seed.mjs";

var app = new Vue({
  el: "#app",
  data: {
    settings: {
      name: "",
      bio: "",
      darkMode: false,
    },
    validExtensions: ["png", "jpg", "jpeg"],
    loading: false,
    loadText: "",
  },
  components: {
    "v-username": v_username,
    "v-bio": v_bio,
    "v-emails": v_emails,
    "v-numbers": v_numbers,
    "v-password": v_password,
    "v-privacy": v_privacy,
    "v-darkmode": v_darkmode,
  },
  mounted: function () {
    this.update();
  },
  computed: {
    isDarkMode: function () {
      return String(this.settings.darkmode).toLowerCase() == "true";
    },
    validExtensionsString: function () {
      let ans = this.validExtensions
        .slice()
        .map((v) => {
          return v.indexOf(".") != 0 ? "." + v : v;
        })
        .join(", ");
      return ans;
    },
  },
  methods: {
    toggleDark: function () {
      this.settings.darkmode = this.isDarkMode ? false : true;
    },
    update: function () {
      const authtoken = localStorage.getItem("authtoken");
      axios
        .get("/users/self", {
          headers: {
            Authorization: "Bearer " + authtoken,
          },
        })
        .then((res) => {
          // console.log("success");
          // console.log(res.data);
          let obj = res.data;
          for (let k in obj) {
            this.$set(this.settings, k, obj[k]);
          }
        })
        .catch((e) => {
          // console.log("failed");
          // console.log(e);
          if (e.response && e.response.status == 401) {
            window.location.href = "/login";
          }
        });
    },
    upload: function () {
      // console.log("changed");
      let el = Sizzle.matches("#file")[0];
      // console.log(el);
      if (el.files.length == 0) {
        return;
      }
      var file = el.files[0];
      if (file.size == 0) {
        return;
      }
      // console.log(file);
      uploader.call(this, file);
    },
  },
});

async function uploader(file) {
  let formData = new FormData();
  formData.append(file.name, file);

  axios
    .post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(() => {
      // console.log(`Sent ${file.name}`);
      this.loading = true;
      this.loadText = "Uploading";
      let src = this.settings.image;
      this.settings.image = "";
      this.update();
      setTimeout(() => {
        this.settings.image = src + "?" + new Date().getTime();
        this.loading = false;
      }, 1000);
    })
    .catch((e) => {
      console.log(`Unable to send ${file.name} : ${e}`);
      console.log(e.response);
    })
    .finally(() => {
      // console.log("completed image upload");
    });
}
