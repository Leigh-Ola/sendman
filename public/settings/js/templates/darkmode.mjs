function save(val) {
  const authtoken = localStorage.getItem("authtoken");
  return new Promise((resolve, reject) => {
    axios
      .post(
        "/users/self/darkmode",
        {
          value: val,
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
        // console.log(res);
        let status = res.status;
        if (status > 299) {
          //   console.log("failed");
          //   return reject(res.data);
        }
        // console.log("succeeded");
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
      saving: false,
    };
  },
  computed: {
    dark: function () {
      return String(this.$props.darkmode).toLowerCase() == "true";
    },
  },
  methods: {
    toggle: function () {
      this.$props.darkmode = !this.dark;
      this.$emit("toggle");
      save(this.$props.darkmode).catch((e) => {});
    },
  },
  props: ["darkmode"],
  template: `
        <div class="group">
          <div class="inputbox toggler">
            <label for="">Dark Mode</label>
            <div
              class="switchbox"
              :class="{'on': dark}"
              @click.stop="toggle()"
            >
              <div class="switch"></div>
            </div>
          </div>
        </div>
    `,
};

export { template };
