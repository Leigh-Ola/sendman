import { utilities } from "../utilities.js";

var message = {
  data: () => {
    return {};
  },
  computed: {
    extension: function() {
      return this.$props.message.name
        .split(".")
        .reverse()[0]
        .toLowerCase();
    },
    thumbnail: function() {
      let ext = this.extension;
      let thumb = utilities.fileThumbnail(ext);
      return thumb;
    },
    name: function() {
      let name = this.$props.message.name;
      if (name.length <= 20) {
        return name;
      }
      let ans = name.substr(0, 15) + "..." + this.extension;
      return ans;
    },
    timePassed: function() {
      // console.log(this.$props.chat);
      // console.log(this.$props.chat.image);
      // http://localhost:8080/images/user/1594761128303drxmka7eqiojw8f8g
      let time = this.$props.message.time;
      let then = new Date(time);
      return utilities.passedTime(then);
    }
  },
  props: ["message", "chat"],
  template: `
          <div class="msgline" 
            :class="[message.isme? '' : 'left']"
          >
            <div class="msgbox">
              <a class="iconbox" :href="message.link">
                <i class="onHover fa fa-arrow-down"></i>
                <img :src="thumbnail" alt="" />
              </a>
              <div class="details">
                <span class="name">
                  <b>{{message.name}}</b>
                  <small class="views" v-if="chat.type=='private'">{{message.views}}<i class="fa fa-eye"></i></small>
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
  mounted: function() {}
};

export { message as template };
