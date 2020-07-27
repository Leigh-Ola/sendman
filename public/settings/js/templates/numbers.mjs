function save(number = "", remove = []) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        "/users/self/numbers",
        {
          value: number,
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

let template = {
  data: function() {
    return {
      error: "",
      valid: true,
      saving: false,
      showinput: false,
      tempnumber: "",
      removed: []
    };
  },
  watch: {
    tempnumber: function(val) {
      if (this.saving) {
        return;
      }
      if (!/^([0-9]{7,20})$/g.test(val)) {
        this.valid = false;
        this.error = "Invalid phone number";
      } else {
        this.valid = true;
        this.error = "";
      }
    },
    removed: function() {
      if (this.error && this.valid) {
        this.error = "";
      }
    }
  },
  methods: {
    remove: function(number) {
      this.removed.push(number);
    },
    save: function() {
      if ((!this.error || this.removed.length) && !this.saving) {
        let removed = this.removed,
          temp = this.tempnumber;
        let num = this.error ? "" : Number(temp.trim());
        this.error = "Saving...";
        this.saving = true;
        this.valid = true;
        save(num, removed)
          .then(() => {
            this.error = "Saved";
            this.saving = false;
            for (let nb of removed) {
              let p_numbers = this.$props.numbers;
              for (let nk in p_numbers) {
                if (nb == p_numbers[nk]) {
                  this.$props.numbers.splice(nk, 1);
                }
              }
            }
            if (num) {
              this.$props.numbers.push(num);
            }
            this.removed = [];
            this.showinput = false;
            this.tempnumber = "";
            this.$emit("update");
          })
          .catch(e => {
            this.valid = false;
            this.error = e;
            this.removed = [];
            this.saving = false;
          });
      }
    }
  },
  props: ["numbers"],
  template: `
<div class="group" v-cloak>
    <header>numbers</header>
    <div class="item" 
      v-for="number in numbers"
      v-if="!removed.includes(number)"
    >
        <span>{{number}}</span>
        <i class="fa fa-trash" @click="remove(number)"></i>
    </div>
    <input type="text" class="add" v-if="showinput" v-model="tempnumber"/>
    <ins v-if="showinput || saving" :class="{'error': !valid}">{{error}}</ins>
    <button class="new" 
        @click="tempnumber=''; showinput=true;" 
        v-if="!showinput"
    >New</button>
    <button class="submit" :class="{'disabled': saving}" @click.stop="save()">Save</button>
</div>
`
};

export { template };
