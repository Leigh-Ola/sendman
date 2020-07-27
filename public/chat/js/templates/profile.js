import { utilities } from "../utilities.js";

var profile = {
  data: function() {
    return {
      currentFile: undefined
    };
  },
  methods: {
    close: function() {
      this.currentFile = undefined;
      this.$emit("vclose");
    },
    thumbnail: function(file) {
      let ext = file.name
        .split(".")
        .reverse()[0]
        .toLowerCase();
      let thumb = utilities.fileThumbnail(ext);
      return thumb;
    },
    showFile: function(file) {}
  },
  computed: {
    isGroup: function() {
      return this.$props.chat.type.toLowerCase() == "group";
    },
    currentFileName: function() {
      let name = this.currentFile.name;
      return utilities.cropText(name, 40);
    },
    showMe: function() {
      return this.$props.chat && this.$props.showprofile;
    }
  },
  props: ["chat", "files", "showprofile"],
  template: `
  <div class="profilepopup" 
    @click.stop="close()"
    :class="{'show': showMe}"
  >
    <i class="fa fa-times"></i>
    <div class="profilewrapper" v-if="showMe" v-cloak>
      <div class="profilebox" @click.stop="currentFile = null">
          <div class="dpbox">
            <img class="dp" :src="chat.image"/>
            <span class="name">{{chat.name}}</span>
          </div>
          <div class="bio" v-if="!isGroup">
            {{chat.bio}}
          </div>
          <div class="detailsbox" v-if="!isGroup">
              <small>Emails</small>
              <div class='empty' v-if="!chat.emails.length">Nothing to show</div>
              <span v-for="email in chat.emails" v-else>{{email}}</span>
          </div>
          <div class="detailsbox" v-if="!isGroup">
              <small>Phone Numbers</small>
              <div class='empty' v-if="!chat.numbers.length">Nothing to show</div>
              <span v-for="number in chat.numbers" v-else>{{number}}</span>
          </div>
          <div class="detailsbox" v-if="isGroup">
              <small>Members</small>
              <div class='empty' v-if="!chat.members.length">Nothing to show</div>
              <span v-for="member in chat.members" v-else>{{member}}</span>
          </div>
          <div class="detailsbox">
            <small>Files</small>
            <div class='empty' v-if="!files.length">Nothing to show</div>
            <div class="filesbox" v-else>
              <div class="img" 
                @click.stop="currentFile = file" 
                :class="{'isActive': currentFile && currentFile.link==file.link}"
                v-for="file in files"
              >
                  <img :src="thumbnail(file)" :alt="file.name" />
              </div>
            </div>
            <a class="file" 
              :href="currentFile.link" 
              v-if="currentFile"
              @click.stop=''
            >
                {{currentFileName}}
                <i>[{{currentFile.size}}]</i>
            </a>
        </div>
        <div class="date">
            Created: <span>July 1, 2020</span>
        </div>
          </div>
        </div>
      </div>
      `
};

export { profile as template };
