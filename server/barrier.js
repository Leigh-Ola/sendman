var settings = {};

function randChars(len = 10) {
  let letters = "abcdefghijklmnopqrstuvwxyz";
  let numbers = "0123456789";
  let all = [...letters, ...numbers];
  let ans = "";
  for (let i = 0; i < len; i++) {
    ans += all[Math.floor(Math.random() * all.length)];
  }
  return String(ans);
}

var wrapper = function() {
  function authenticate(
    f,
    obj = {
      username: undefined,
      password: undefined,
      location: undefined
    }
  ) {
    let {
      username = "username",
      password = "password",
      location = "query"
    } = obj;

    // console.log(username, password, location);
    return function(req, res, next) {
      let uname = req[location][username];
      let pwd = req[location][password];

      let verify = f(uname, pwd);
      // ^ make sure user exists in the database
      if (typeof verify != "string") {
        // not verified
        // console.log("authentication failed");
        req.session.barrier = {};
        res.locals.barrier = {
          authenticated: false,
          error: verify.error ? verify.error : "Unknown error"
        };
        return next();
      }
      // console.log("authentication successful");
      let user = {
        user_id: verify,
        auth_id: randChars(20)
      };
      req.session.barrier = { user };
      // console.log(req.session.barrier);
      res.locals.barrier = {
        authenticated: true
      };
      /* {
         maxAge: 1000 * 60 * 60 * 24 * 3,
         secure: true,
         sameSite: true
       } */
      res.cookie("barrier_auth_id", user.auth_id, {
        maxAge: 1000 * 60 * 60 * 24 * 3,
        httpOnly: true,
        secure: true
      });
      // ^ save cookie for user session
      return next();
    };
  }

  function verify(req, res, next) {
    var session = req.session,
      barrier = false;
    if (session.barrier && session.barrier.user) {
      var user = req.session.barrier.user;
      barrier = true;
    }
    let cookies = req.cookies;

    // console.log("cookies >> ", JSON.stringify(cookies));
    // console.log("session >> ", JSON.stringify(user));
    if (
      barrier &&
      user.auth_id &&
      cookies &&
      cookies["barrier_auth_id"] == user.auth_id
    ) {
      // console.log("verification success");
      res.locals.barrier = {
        authenticated: true
      };
      return next();
    } else {
      // console.log("verification failed");
      // console.log(cookies);
      // console.log(req.session.barrier);
      res.locals.barrier = {
        authenticated: false
      };
      if (barrier) {
        req.session.barrier.user = {};
      }
      res.clearCookie("barrier_auth_id");
      return next();
    }
  }
  return {
    authenticate,
    verify
  };
};

module.exports = wrapper();
