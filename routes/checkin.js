/*
 route for /checkin
*/
const express = require("express");
const router = express.Router();

const database = require("../server/db");

router.all("*", async (req, res, next) => {
  // console.log(`Authorized to access : ${req.originalUrl}`);
  var id = res.locals.barrier.user.user_id;
  // var id = "1595071228118GBiku01ta7aTEOX7M";
  // req.session.barrier = { user: { user_id: id } };

  let db = database.connect("users");
  let time = new Date().toISOString();

  db.set(id + ".lastSeen", time).write();
  next();
});

module.exports = router;
