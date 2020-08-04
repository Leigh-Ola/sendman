function save(name, id = "", remove = []) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        "/users/self/" + name,
        {
          value: id,
          remove: remove
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

var user = {
  data: function() {
    return {
      slide: false,
      show: true
    };
  },
  methods: {
    switchUser: function(id) {
      this.slide = false;
      this.$emit("switch", id);
    },
    toggleMute: async function() {
      let user = this.$props.user;
      let ismute = user.muted;
      this.$props.user.muted = !ismute;

      let id = ismute ? "" : this.user.chatId;
      let rem = ismute ? [this.user.chatId] : [];
      this.slide = false;
      save("muted", id, rem);
    },
    toggleArchive: async function() {
      let user = this.$props.user;
      let isarchived = user.archived;
      this.$props.user.archived = !isarchived;

      let id = isarchived ? "" : this.user.chatId;
      let rem = isarchived ? [this.user.chatId] : [];
      this.slide = false;
      save("archived", id, rem);
      this.show = false;
    },
    togglePin: async function() {
      let user = this.$props.user;
      let ispinned = user.pinned;
      this.$props.user.pinned = !ispinned;

      let id = ispinned ? "" : this.user.chatId;
      let rem = ispinned ? [this.user.chatId] : [];
      this.slide = false;
      save("pinned", id, rem);
      this.$emit("pin", id);
    }
  },
  watch: {
    active_id: function() {
      this.slide = false;
      this.show = true;
    }
  },
  computed: {
    isGroup: function() {
      return this.$props.user.type == "group";
    }
  },
  props: ["user", "active_id"],
  template: `
         <div class="contact" v-show='show' @click.stop="slide=false">
            <div class="contactoption">
              <span  v-if="user.muted" @click.stop="toggleMute()"><i class="fa fa-volume-down"></i>Unmute</span>
              <span  v-else  @click.stop="toggleMute()"><i class="fa fa-volume-up"></i>Mute</span>
              <span  v-if="user.archived"  @click.stop="toggleArchive()"><i class="fa fa-archive"></i>Unarchive</span>
              <span  v-else  @click.stop="toggleArchive()"><i class="fa fa-archive"></i>Archive</span>
              <span  v-if="user.pinned" @click.stop="togglePin()"><i class="fa fa-thumb-tack"></i>Unpin</span>
              <span  v-else  @click.stop="togglePin()"><i class="fa fa-thumb-tack"></i>Pin</span>
            </div>
            <div class="contactinside" 
              :class="[slide? 'slide' : '', active_id==user.id? 'active' : '']"
              @click.stop="switchUser(user.id)"
            >
              <i class="more fa" 
                @click.stop="slide = !slide"
                :class="[slide? 'fa-arrow-left' : 'fa-ellipsis-v']"  
              ></i>
              <img :src="user.image+'?'+new Date().getTime()" alt="" />
              <span class="online" v-if="user.online"></span>
              <div class="info">
                <b>
                  <span class='name'>{{isGroup? user.groupname : user.username}}</span>
                  <i class='tag fa fa-volume-down' v-if="user.muted"></i>
                  <i class='tag fa fa-thumb-tack' v-if="user.pinned"></i>
                  <i v-if="user.count>0">{{user.count}}</i>
                </b>
                <span>{{user.filename}}</span>
                <small>{{user.time}}</small>
              </div>
            </div>
          </div>`
};

export { user as template };
