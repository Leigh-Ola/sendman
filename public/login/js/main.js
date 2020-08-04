{
  new Vue({
    el: "#app",
    data: {
      email: "",
      pwd: "",
      email_err: "",
      pwd_err: "",
      err: ""
    },
    mounted: function() {},
    watch: {},
    methods: {
      signin: function(e) {
        let { pwd, email } = this;
        let data = [email, pwd];
        if (!verify.apply(this, data)) {
          let { pwd_err, email_err } = this;
          console.log(pwd_err, email_err);
          e.preventDefault();
          return;
        }
        let form = document.getElementById("myform");
        // console.log(form);
        // console.log(document.forms[0]);
        sendData.apply(this, data);
      }
    }
  });
}

function sendData(email, pwd) {
  let obj = { email: email, password: pwd };
  let self = this;
  $.post(
    "/signin", // url where form should be submitted to
    obj, // data to be submit
    function(data, status, xhr) {
      // callback function
      // console.log("status: " + status + ", data: " + data.responseData);
    },
    "json"
  ) // response data format
    .done(res => {
      console.log("success");
      console.log(res);
      window.location.href = "../index.html";
    })
    .fail(e => {
      console.log("failure");
      let obj = JSON.parse(JSON.stringify(e));
      console.log(obj);
      this.err = obj.responseText;
    });
}

function verify(email, pwd) {
  let err = false;
  this.err = "";
  if (/[^a-zA-Z0-9-_\s\[\]\(\)!.,\+\*]+/g.test(pwd)) {
    this.pwd_err = "Password contains invalid characters";
    err = true;
  }
  if (pwd.length < 5) {
    this.pwd_err = "Password is too short";
    err = true;
  }
  if (pwd.length > 20) {
    this.uname_err = "Password is too long";
    err = true;
  }
  if (!/^([\S]+)@([\S]+)((\.?([\S]+))+)$/g.test(email)) {
    this.email_err = "Invalid Email";
    err = true;
  }
  return !err;
}
