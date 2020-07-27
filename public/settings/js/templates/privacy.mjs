function save(obj) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        "/users/self/privacy",
        {
          value: obj
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
      profileshow: false,
      groupshow: false
    };
  },
  watch: {},
  methods: {
    save: function() {
      if (!this.saving) {
        this.error = "Saving...";
        this.saving = true;
        this.valid = true;
        let obj = {
          profile: this.$props.privacy.profile,
          group: this.$props.privacy.group
        };
        save(obj)
          .then(() => {
            this.error = "Saved";
            this.saving = false;
            this.$emit("update");
          })
          .catch(e => {
            this.valid = false;
            this.error = e;
            this.saving = false;
          });
      }
    }
  },
  props: ["privacy"],
  template: ` 
        <div class="group" v-if="privacy" v-cloak>
          <header>Privacy</header>
          <div class="privacybox">
            <div class="questionbox">
              <span class="ques">Who can add me to a group?</span>
              <span class="ans"
                @click.stop="groupshow = !groupshow"
              >{{privacy.group}} <i class="fa fa-chevron-down"></i></span>
            </div>
            <div class="options" :class="{'show': groupshow}"
              @click.stop="groupshow = false"
            >
              <div class="option"
                 @click="privacy.group='anyone'"
              >
                <b>Anyone</b>
                <span>Any user can add you to a group</span>
              </div>
              <div class="option"
                 @click="privacy.group='friends'"
              >
                <b>Friends</b>
                <span>Only people you have contacted</span>
              </div>
              <div class="option"
                 @click="privacy.group='no one'"
              >
                <b>No one</b>
                <span>No can add you to a group</span>
              </div>
            </div>
          </div>
          <div class="privacybox">
            <div class="questionbox">
              <span class="ques">Who can see my profile details?</span>
              <span class="ans"
                @click.stop="profileshow = !profileshow"
              >{{privacy.profile}} <i class="fa fa-chevron-down"></i></span>
            </div>
            <div class="options" :class="{'show': profileshow}"
              @click.stop="profileshow = false"
            >
              <div class="option"
                 @click="privacy.profile='everyone'"
              >
                <b>Everyone</b>
                <span>Every user can see your profile details</span>
              </div>
              <div class="option"
                @click="privacy.profile='friends'"
              >
                <b>Friends</b>
                <span>Only people you have contacted</span>
              </div>
              <div class="option"
                @click="privacy.profile='no one'"
              >
                <b>No one</b>
                <span>No can see your profile settings</span>
              </div>
            </div>
          </div>
          <ins :class="{'error': !valid}">{{error}}</ins>
          <button class="submit" :class="{'disabled': saving}" @click.stop="save()">Save</button>
        </div>`
};

export { template };
