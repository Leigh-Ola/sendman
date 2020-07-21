function save(oldp, newp) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        "/users/self/password",
        {
          value: { old: oldp, new: newp }
        },
        {
          validateStatus: status => {
            return status < 600;
          }
        }
      )
      .then(res => {
        console.log(res);
        let status = res.status;
        if (status > 299) {
          console.log("failed");
          return reject(res.data);
        }
        console.log("succeeded");
        resolve();
      })
      .catch(e => {
        console.log("failed");
        reject("An unknown error occurred. Please try again");
      });
  });
}

let template = {
  data: function() {
    return {
      error: "",
      valid: true,
      saving: false,
      oldp: "testuser",
      newp: "password",
      confirm: "password"
    };
  },
  watch: {
    oldp: function(val) {
      this.$nextTick(() => {
        this.validate();
      });
    },
    newp: function(val) {
      this.$nextTick(() => {
        this.validate();
      });
    },
    confirm: function(val) {
      this.$nextTick(() => {
        this.validate();
      });
    }
  },
  methods: {
    validate: function() {
      if (this.saving) {
        return;
      }
      if (!this.oldp || !this.newp || !this.confirm) {
        this.valid = false;
        this.error = "Fields cannot be empty";
      } else if (/[^a-zA-Z0-9-_\[\]\(\)!\.,\+\*]+/g.test(this.newp)) {
        this.valid = false;
        this.error = "New password contans invalid characters";
      } else if (this.newp.length < 6 || this.newp.length > 35) {
        this.valid = false;
        this.error = "New password must be between 6-35 characters long";
      } else if (this.confirm != this.newp) {
        this.valid = false;
        this.error = "Passwords do not match";
      } else {
        this.valid = true;
        this.error = "";
      }
    },
    save: function() {
      if (!this.error && !this.saving) {
        this.error = "Saving...";
        this.saving = true;
        this.valid = true;
        let oldp = this.oldp.trim(),
          newp = this.newp.trim();
        save(oldp, newp)
          .then(() => {
            this.error = "";
            this.saving = false;
            this.$emit("update");
          })
          .catch(e => {
            console.log(e);
            this.valid = false;
            this.error = e;
            this.saving = false;
          });
      }
    }
  },
  props: [],
  template: `
        <div class="group" v-cloak>
          <header>Password</header>
          <div class="inputbox">
            <label for="oldpassword">Current password:</label>
            <input v-model="oldp" type="password" name="oldpassword" />
          </div>
          <div class="inputbox">
            <label for="newpassword">New password:</label>
            <input v-model="newp" type="password" name="newpassword" />
          </div>
          <div class="inputbox">
            <label for="confirm">Confirm new password:</label>
            <input v-model="confirm" type="password" name="confirm" />
          </div>
          <ins :class="{'error': !valid}">{{error}}</ins>
          <button class="submit" :class="{'disabled': saving}" @click.stop="save()">Save</button>
        </div>`
};

export { template };
