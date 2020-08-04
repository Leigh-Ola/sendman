/*
 route for /transferss = require
*/
const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");
const glob = require("glob");

const database = require("../server/db");

router.get("/:chatId", async (req, res, next) => {
  var id = req.session.barrier.user.user_id;

  let { chatId } = req.params;
  // console.log(chatId);

  let db = await database.connect("users");

  // End if chatId does not exist for user
  let chatExists = Boolean(
    db
      .get(id + ".chats")
      .filter({ chatId: chatId })
      .value()
  );
  if (!chatExists) {
    return res.status(401).send(`Unable to access chat '${chatId}'`);
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
      fileId: v.fileId,
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

router.delete("/:chatId/:fileId", async (req, res, next) => {
  var id = req.session.barrier.user.user_id;

  let { chatId, fileId } = req.params;

  let db = await database.connect("users");

  // End if chatId does not exist for user
  let chatExists = Boolean(
    db
      .get(id + ".chats")
      .filter({ chatId: chatId })
      .value()
  );
  if (!chatExists) {
    return res.status(401).send(`Unable to find chat '${chatId}'`);
  }

  let chatDb = await database.connectChat(chatId);
  let transferExists = chatDb
    .get("transfers")
    .filter({ fileId })
    .value();
  if (!Boolean(transferExists.length)) {
    return res.status(401).send(`Unable to find transfer '${chatId}'`);
  }
  let sender = id;
  let fname = transferExists[0].name;

  let pattern = path.resolve(
    __dirname,
    "../server/storage/files/" + sender + "/" + fname
  );
  // console.log(pattern);
  glob(pattern, (err, files) => {
    if (err || !files.length) {
      return res.status(401).send(`Unable to delete file '${fileId}'`);
    }
    var fp = path.resolve(__dirname, files[0]);

    fs.unlink(fp, err => {
      if (err) {
        return res.status(401).send(`Unable to delete file '${fileId}'`);
      }
      chatDb
        .get("transfers")
        .remove(transfer => {
          return transfer.fileId == fileId;
        })
        .write();
    });

    return res.status(200).json({ done: true });
  });
});

module.exports = router;
