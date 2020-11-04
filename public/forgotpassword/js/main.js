{
  new Vue({
    el: "#app",
    data: {
      email: "",
      email_err: "",
      err: "",
      msg: "",
    },
    mounted: function () {},
    watch: {},
    methods: {
      signin: function (e) {
        let { email } = this;
        let data = [email];
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
      },
    },
  });
}

function sendData(email) {
  let obj = { email: email };
  let self = this;
  $.post(
    "/resetpassword", // url where form should be submitted to
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
      this.msg = "Please check your email";
      window.location.href = "/login/index.html";
    })
    .fail((e) => {
      console.log("failure");
      let obj = JSON.parse(JSON.stringify(e));
      console.log(obj);
      this.err = obj.responseText;
    });
}

function verify(email, pwd) {
  let err = false;
  this.err = "";
  if (!/^([\S]+)@([\S]+)((\.?([\S]+))+)$/g.test(email)) {
    this.email_err = "Invalid Email";
    err = true;
  }
  return !err;
}
