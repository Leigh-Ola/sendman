{
  new Vue({
    el: "#app",
    data: {
      uname: "",
      num: "",
      email: "",
      pwd: "",
      confirm_pwd: "",
      uname_err: "",
      num_err: "",
      email_err: "",
      pwd_err: "",
      confirm_pwd_err: "",
      err: "",
    },
    mounted: function () {},
    watch: {},
    methods: {
      signup: function (e) {
        let { uname, num, pwd, confirm_pwd, email } = this;
        let data = [uname, num, email, pwd, confirm_pwd];
        if (!verify.apply(this, data)) {
          let {
            uname_err,
            num_err,
            pwd_err,
            confirm_pwd_err,
            email_err,
          } = this;
          console.log(uname_err, num_err, pwd_err, confirm_pwd_err, email_err);
          return;
        }
        sendData.apply(this, data);
      },
    },
  });
}

function sendData(uname, num, email, pwd) {
  let obj = { username: uname, number: num, email: email, password: pwd };
  let self = this;
  $.post(
    "/signup", // url where form should be submitted to
    obj, // data to be submit
    function (data, status, xhr) {
      // callback function
      // console.log("status: " + status + ", data: " + data.responseData);
    },
    "json"
  ) // response data format
    .done((res) => {
      console.log("success");
      console.log(res);
      window.localStorage.setItem("authtoken", res.token);
      window.location.href = "../index.html";
    })
    .fail((e) => {
      let obj = JSON.parse(JSON.stringify(e));
      this.err = obj.responseText;
    });
}

function verify(uname, num, email, pwd, confirm_pwd) {
  let err = false;
  this.err = "";
  if (/[^a-zA-Z\s-_]+/g.test(uname)) {
    this.uname_err = "Username contains invalid characters";
    err = true;
  }
  if (uname.length < 5) {
    this.uname_err = "Username is too short";
    err = true;
  }
  if (uname.length > 20) {
    this.uname_err = "Username is too long";
    err = true;
  }
  if (!/^([0-9]{6,25})$/g.test(num)) {
    this.num_err = "Invalid phone number";
    err = true;
  }
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
  if (pwd != confirm_pwd) {
    this.confirm_pwd_err = "Passwords do not match";
    err = true;
  }
  return !err;
}
