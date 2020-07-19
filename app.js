const express = require("express");
const app = express();

const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const cors = require("cors");

const _ = require("lodash");
const morgan = require("morgan");
const glob = require("glob");

const barrier = require("./server/barrier.js");
const validator = require("./server/validate.js");
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
    extended: true
  })
);
app.use(bodyParser.json());

// allow use of cookies
app.use(cookieParser());

// track logged in user across sessions
app.use(
  expressSession({
    key: "session_id",
    secret: "sendmansecretapp",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 1000 * 60 * 60 * 24 // millisecs
    }
  })
);

var auth = barrier.authenticate(
  (email, password) => {
    // console.log(`Authenticating... uname: ${email}; pwd: ${password}`);
    let db = database.connect("users");
    let match = _.filter(db.value(), { mainEmail: email });
    if (!match.length) {
      // res.status(400).send("Incorrect email or password");
      return { error: "Incorrect email or password" };
    }
    match = match[0];
    // console.log(JSON.stringify(match));
    if (match.password != password) {
      // res.status(400).send("Incorrect email or password");
      return { error: "Incorrect email or password" };
    }
    return String(match.id);
  },
  {
    username: "email",
    password: "password",
    location: "body"
  }
);

app.set("port", process.env.PORT || 8080);
app.use(express.static(__dirname + "/public"));

/* routes */
let check_in = require("./routes/checkin");
app.use("/users", barrier.verify, check_in, require("./routes/users"));
app.use("/newchat", barrier.verify, check_in, require("./routes/newchat"));
app.use("/upload", barrier.verify, check_in, require("./routes/upload"));
app.use("/transfers", barrier.verify, check_in, require("./routes/transfers"));
app.use("/download", barrier.verify, check_in, require("./routes/download"));
app.use("/images", barrier.verify, check_in, require("./routes/images"));

app.post("/signin", auth, (req, res, next) => {
  if (res.locals.barrier.authenticated) {
    res.status(200).json({ done: true });
  } else {
    let error = res.locals.barrier.error;
    res.status(500).send(error);
  }
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
          id
        });
        let matches = _.filter(db.value(), { mainEmail: email });
        let exists = Boolean(matches.length);
        // console.log(matches);
        if (exists) {
          res.status(400).send("An account with this email already exists");
        } else {
          db.set(id, user).write();
          let pathToFiles = path.resolve(
            __dirname,
            "./server/storage/files/" + id
          );
          await utils.makeDir(pathToFiles);
          next();
        }
      } catch (error) {
        if (!err) {
          res.status(500).send("Error registering. Please try again.");
          err = true;
        }
      }
    }
  },
  auth,
  (req, res, next) => {
    console.log(`Authenticated? ${res.locals.barrier.authenticated}`);
    if (res.locals.barrier.authenticated) {
      res.status(200).json({ done: true });
    } else {
      res.status(500).send("Error registering. Please try again.");
    }
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
