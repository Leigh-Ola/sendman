function save(username) {
  const authtoken = localStorage.getItem("authtoken");
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      axios
        .post(
          "/users/self/username",
          {
            value: username,
          },
          {
            validateStatus: (status) => {
              return status < 600;
            },
            headers: {
              Authorization: "Bearer " + authtoken,
            },
          }
        )
        .then((res) => {
          console.log(res);
          let status = res.status;
          if (status > 299) {
            console.log("failed");
            return reject(res.data);
          }
          console.log("succeeded");
          resolve();
        })
        .catch((e) => {
          console.log("failed");
          reject("An unknown error occurred. Please try again");
        });
    }, 2000);
  });
}

let template = {
  data: function () {
    return {
      error: "",
      valid: true,
      saving: false,
    };
  },
  watch: {
    username: function (val) {
      if (this.saving) {
        return;
      }
      if (val.length < 3 || val.length > 20) {
        this.valid = false;
        this.error = "Username must be between 3-20 characters";
      } else if (!/^[A-Za-z0-9\s_\-\.]+$/g.test(val)) {
        this.valid = false;
        this.error = "Username contans invalid characters";
      } else {
        this.valid = true;
        this.error = "";
      }
    },
  },
  methods: {
    save: function () {
      if (!this.error && !this.saving) {
        this.error = "Saving...";
        this.saving = true;
        this.valid = true;
        save(this.username.trim())
          .then(() => {
            this.error = "Saved";
            this.saving = false;
            this.$emit("update");
          })
          .catch((e) => {
            this.valid = false;
            this.error = e;
            this.saving = false;
          });
      }
    },
  },
  props: ["username"],
  template: `
<div class="group" v-cloak>
    <header>Username</header>
    <input maxlength="20" minlength="3" type="text" name="username" v-model="username" />
    <ins :class="{'error': !valid}">{{error}}</ins>
    <button class="submit" :class="{'disabled': saving}" @click.stop="save()">Save</button>
</div>
    `,
};

export { template };
