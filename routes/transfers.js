/*
 route for /chats
*/
const express = require("express");
const router = express.Router();

const database = require("../server/db");

router.get("/", async (req, res, next) => {
  var id = req.session.barrier.user.user_id;
  // id = "1594761107571q5eoq63lqs0y6u6f3";

  let { chatId } = req.query;
  // console.log(chatId);

  let db = await database.connect("users");

  // End if chatId does not exist for user
  let chatExists = db
    .get(id + ".chats")
    .filter({ chatId: chatId })
    .value().length;
  if (!chatExists) {
    return res.status(200).json({
      done: false,
      error: `Unable to access chat '${chatId}'`
    });
  }

  let chatDb = await database.connectChat(chatId);
  let transfers = chatDb.get("transfers").value();
  // console.log(`Transfers : ${transfers.length}`);
  if (transfers && transfers.length) {
    let newTransfers = transfers.map((v, i, t) => {
      if (!v.seen.includes(id)) {
        v.seen.push(id);
      }
      return v;
    });
    chatDb.set("transfers", newTransfers).write();
  }
  transfers = transfers.map((v, i, arr) => {
    let ans = {
      link: v.link,
      size: v.size,
      views: v.seen.length,
      time: v.time,
      senderimage: v.senderimage
    };
    ans.isme = v.sender == id;
    ans.name = v.realName; //.replace(/^[\d]+_/, "");
    return ans;
  });
  // console.log(`Transfers : ${transfers.length}`);
  /**
    x  link: "craplink4.html",
      time: "6 minutes ago",
    x  name: "MyRecording.wav",
    x  size: "1.5mb",
    x  views: 1,
    x  isme: true
    }
     */
  res.status(200).json({ done: true, data: transfers });
});

module.exports = router;
