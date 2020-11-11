import { utilities } from "../utilities.js";

async function deleteMessage(chatId, fileId) {
  const authtoken = localStorage.getItem("authtoken");
  const config = {
    headers: { Authorization: "Bearer " + authtoken },
  };
  let url = `/transfers/${chatId}/${fileId}`;
  return await axios
    .delete(url, config, config)
    .then((res) => {
      // console.log("yasss");
      // console.log(res.data);
      // return res.data.data;
    })
    .catch((e) => {
      // console.log("noooo");
      // console.log(e);
      return;
    });
}

var message = {
  data: () => {
    return {
      showDelete: false,
      lastShowDelete: 0,
      deleted: false,
    };
  },
  watch: {
    showDelete: function (val) {
      this.lastShowDelete = new Date().getTime();
      if (val) {
        setTimeout(() => {
          if (new Date().getTime() - this.lastShowDelete >= 2900) {
            this.showDelete = false;
          }
        }, 3000);
      }
    },
    deleted: async function (del) {
      if (!del) {
        return;
      }
      let chatId = this.$props.chat.chatId;
      let fileId = this.$props.message.fileId;
      this.$nextTick(async () => {
        this.$emit("delete", fileId);
        await deleteMessage(chatId, fileId);
        this.showDelete = false;
      });
    },
  },
  computed: {
    extension: function () {
      return this.$props.message.name.split(".").reverse()[0].toLowerCase();
    },
    thumbnail: function () {
      let ext = this.extension;
      let thumb = utilities.fileThumbnail(ext);
      return thumb;
    },
    name: function () {
      let name = this.$props.message.name;
      if (name.length <= 20) {
        return name;
      }
      let ans = name.substr(0, 15) + "..." + this.extension;
      return ans;
    },
    timePassed: function () {
      // console.log(this.$props.chat);
      // console.log(this.$props.chat.image);
      // http://localhost:8080/images/user/1594761128303drxmka7eqiojw8f8g
      let time = this.$props.message.time;
      let then = new Date(time);
      return utilities.passedTime(then);
    },
  },
  props: ["message", "chat"],
  template: `
          <div class="msgline" 
            :class="[message.isme? '' : 'left']"
          >
            <div class="msgbox" @click.stop="showDelete = !showDelete">
              <div class="deletebox" :class="{'show': showDelete}" @click.stop="deleted = true">
                <i class="fa fa-trash"></i>
              </div>
              <a class="iconbox" :href="message.link" @click.stop="">
                <i class="onHover fa fa-arrow-down"></i>
                <img :src="thumbnail" alt="" />
              </a>
              <div class="details">
                <span class="name">
                  <b>{{message.name}}</b>
                  <small class="views" v-if="chat.type=='group'">{{message.views}}<i class="fa fa-eye"></i></small>
                  <small class="views check" :class="[chat.members==message.views? 'read' : '']" v-else><i class="fa fa-check"></i></small>
                </span>
                <small class="size">{{message.size}}</small>
                <small class="time">{{timePassed}}</small>
              </div>
            </div>
              <img :src="message.senderimage+'?'+new Date().getTime()" alt="" class="profileimg"/>
          </div>
  `,
  methods: {},
  mounted: function () {},
};

export { message as template };
