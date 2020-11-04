const express = require("express");
const app = express();

const path = require("path");
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
// const expressSession = require("express-session");
const cors = require("cors");

const _ = require("lodash");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const glob = require("glob");
require("dotenv").config();

// const barrier = require("./server/barrier.js");
const validator = require("./server/validate.js");
const mailer = require("./server/mailer.js");
// app.use(morgan(":method :url :status"));

// database
const database = require("./server/db.js");
const utils = require("./server/utils.js");

/* middleware */
// accept cross-origin requests
app.use(cors());
// parse incoming parameter requests to req.body
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// allow use of cookies
// app.use(
//   cookieParser("sendmancookiesss", {
//     secure: true,
//   })
// );
/**
 * "sendmancookiesss", {
    secure: true,
    sameSite: "Strict"
  }
 */

// track logged in user across sessions
// app.use(
//   expressSession({
//     key: "session_id",
//     secret: "sendmansecretapp",
//     resave: true,
//     saveUninitialized: false,
//     cookie: {
//       sameSite: "strict",
//     },
//   })
// );

// check jwt authorization
var auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  res.locals.barrier = {};
  res.locals.barrier.authenticated = false;
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(401).send("Authorization failed");
        }
        if (typeof role === "string" && user.role != role) {
          return res.status(401).send("Authorization failed");
        }
        res.locals.barrier.user = user;
        res.locals.barrier.authenticated = true;
        console.log("Authorized");
        next();
      });
    } catch (error) {
      console.log(`Not authorized to access : ${req.originalUrl}`);
      return res.status(401).send("Authorization failed");
    }
  } else {
    console.log(`Not authorized to access : ${req.originalUrl}`);
    return res.status(401).send("Authorization required");
  }
};

app.set("port", process.env.PORT || 8080);
app.use(express.static(__dirname + "/public"));

/* routes */
let check_in = require("./routes/checkin");
app.use("/users", auth, check_in, require("./routes/users"));
app.use("/newchat", auth, check_in, require("./routes/newchat"));
app.use("/upload", auth, check_in, require("./routes/upload"));
app.use("/transfers", auth, check_in, require("./routes/transfers"));
app.use("/download", auth, check_in, require("./routes/download"));
app.use("/images", require("./routes/images")); // no need for auth when loading images

app.post("/resetpassword", async (req, res) => {
  return res.json({ done: true });
  let { email } = req.body;
  let db = database.connect("users");
  let match = _.filter(db.value(), { mainEmail: email });
  if (!match.length) {
    return res.status(400).send("This email is not registered with sendman");
  }
  match = match[0];
  let password = utils.randomString(15, false);
  match.password = password;
  mailer.send(email, "password", { password: password }).catch((err) => {});
  db.set(match.id + "." + password).write();
  res.json({ done: true });
});

app.post("/signin", (req, res, next) => {
  let { email, password } = req.body;
  let db = database.connect("users");
  let match = _.filter(db.value(), { mainEmail: email });
  if (!match.length) {
    return res.status(400).send("Incorrect email or password");
  }
  match = match[0];
  if (match.password != password) {
    return res.status(400).send("Incorrect email or password");
  }
  let id = match.id;
  console.log(id);
  const token = jwt.sign(
    {
      role: "user",
      user_id: id,
      authenticated: true,
    },
    process.env.JWT_SECRET
  );
  console.log(token);
  res.json({ done: true, token });
  console.log("Logging in complete");
  // req.session.barrier.user.user_id
  // res.status(400).send("testing");
  // if (res.locals.barrier.authenticated) {
  //   const token = jwt.sign(
  //     {
  //       role: "user",
  //       id: user.id,
  //     },
  //     process.env.JWT_SECRET
  //   );
  //   res.json({ token });
  //   res.status(200).json({ done: true });
  // } else {
  //   let error = res.locals.barrier.error;
  //   res.status(500).send(error);
  // }
});

app.post(
  "/signup",
  async (req, res, next) => {
    let { username, number, password, email } = req.body;
    console.log(username, password, email);
    let validate = validator.normal;
    let validation = validate(username, password, email);
    if (validation.length) {
      res.status(400).send("Invalid registration details");
    } else {
      try {
        let db = database.connect("users");
        let id = utils.randomString(30);
        let user = utils.createUser({
          username,
          number,
          password,
          email,
          id,
        });
        let matches = _.filter(db.value(), { mainEmail: email });
        let exists = Boolean(matches.length);
        // console.log(matches);
        if (exists) {
          console.log(matches);
          res.status(400).send("An account with this email already exists");
        } else {
          db.set(id, user).write();
          let pathToFiles = path.resolve(
            __dirname,
            "./server/storage/files/" + id
          );
          await utils.makeDir(pathToFiles);
          res.locals.user_id = id;
          next();
        }
      } catch (error) {
        if (!error) {
          console.log("no error");
          res.status(500).send("Error registering. Please try again.");
          err = true;
        } else {
          console.log(error);
          res.status(500).send("Error registering. Please try again.");
        }
      }
    }
  },
  (req, res, next) => {
    // console.log(`Authenticated? ${res.locals.barrier.authenticated}`);
    let id = res.locals.user_id;
    const token = jwt.sign(
      {
        role: "user",
        user_id: id,
        authenticated: true,
      },
      process.env.JWT_SECRET
    );
    // console.log(token);
    res.json({ done: true, token });
    // console.log("Registration complete");
  }
);

/* ERROR pages */
app.use((req, res) => {
  res.status(404);
  res.set("Content-Type", "text/plain");
  res.send("404 - Page Not Found");
}); // 404

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // add_err_to_log(500);
  res.status(500);
  res.set("Content-Type", "text/plain");
  res.send("500 - Internal Server Error");
}); //500

// start server
app.listen(app.get("port"), () => {
  console.log("Running chat app on localhost://" + app.get("port"));
});
