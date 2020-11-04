function save(bio) {
  const authtoken = localStorage.getItem("authtoken");
  return new Promise((resolve, reject) => {
    axios
      .post(
        "/users/self/bio",
        {
          value: bio,
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
    };
  },
  watch: {
    bio: function (val) {
      if (this.saving) {
        return;
      }
      if (val.length < 3 || val.length > 250) {
        this.valid = false;
        this.error = "Bio must be between 3-250 characters";
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
        save(this.bio.trim())
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
  props: ["bio"],
  template: `
<div class="group" v-cloak>
    <header>Bio</header>
    <textarea maxlength="250" minlength="3" name="bio" v-model="bio"></textarea>
    <ins :class="{'error': !valid}">{{error}}</ins>
    <button class="submit" :class="{'disabled': saving}" @click.stop="save()">Save</button>
</div>
    `,
};

export { template };
