function save(email = "", remove = []) {
  const authtoken = localStorage.getItem("authtoken");
  return new Promise((resolve, reject) => {
    axios
      .post(
        "/users/self/emails",
        {
          value: email,
          remove: remove,
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
  });
}

let template = {
  data: function () {
    return {
      error: "",
      valid: true,
      saving: false,
      showinput: false,
      tempemail: "",
      removed: [],
    };
  },
  watch: {
    tempemail: function (val) {
      if (this.saving) {
        return;
      }
      if (val.length < 3 || val.length > 250) {
        this.valid = false;
        this.error = "Invalid email address";
      } else if (!/^([\S]+)@(([A-Za-z]+)(\.))+([A-Za-z]+)+$/g.test(val)) {
        this.valid = false;
        this.error = "Invalid email address";
      } else {
        this.valid = true;
        this.error = "";
      }
    },
    removed: function () {
      if (this.error && this.valid) {
        this.error = "";
      }
    },
  },
  methods: {
    remove: function (email) {
      this.removed.push(email);
    },
    save: function () {
      if ((!this.error || this.removed) && !this.saving) {
        let removed = this.removed,
          temp = this.tempemail;
        let email = this.error ? "" : temp.trim();
        this.error = "Saving...";
        this.saving = true;
        this.valid = true;
        save(email, removed)
          .then(() => {
            this.error = "Saved";
            this.saving = false;
            for (let em of removed) {
              let p_emails = this.$props.emails;
              for (let ek in p_emails) {
                if (em == p_emails[ek]) {
                  this.$props.emails.splice(ek, 1);
                }
              }
            }
            if (email) {
              this.$props.emails.push(email);
            }
            this.removed = [];
            this.showinput = false;
            this.tempemail = "";
            this.$emit("update");
          })
          .catch((e) => {
            this.valid = false;
            this.error = e;
            this.removed = [];
            this.saving = false;
          });
      }
    },
  },
  props: ["emails"],
  template: `
<div class="group" v-cloak>
    <header>Emails</header>
    <div class="item" 
      v-for="email in emails"
      v-if="!removed.includes(email)"
    >
        <span>{{email}}</span>
        <i class="fa fa-trash" @click="remove(email)"></i>
    </div>
    <input type="email" class="add" v-if="showinput" v-model="tempemail"/>
    <ins v-if="showinput || saving" :class="{'error': !valid}">{{error}}</ins>
    <button class="new" 
        @click="tempemail=''; showinput=true;" 
        v-if="!showinput"
    >New</button>
    <button class="submit" :class="{'disabled': saving}" @click.stop="save()">Save</button>
</div>
`,
};

export { template };
