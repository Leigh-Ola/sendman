/*
 route for /files
*/
const path = require("path");
const express = require("express");
const router = express.Router();

const database = require("../server/db");

router.get("/:chatId/:fileId", async (req, res, next) => {
  var id = req.session.barrier.user.user_id;
  // id = "1594761107571q5eoq63lqs0y6u6f3";

  let { chatId, fileId } = req.params;
  let db = await database.connect("users");
  let hasChat = Boolean(
    db
      .get(id + ".chats")
      .filter({ chatId: chatId })
      .value().length
  );
  if (!hasChat) {
    return res.status(404).send("File not found");
  }
  let chatDb = await database.connectChat(chatId);
  let file = chatDb
    .get("transfers")
    .filter({ fileId: fileId })
    .value();
  if (!Boolean(file.length)) {
    return res.status(404).send("File not found");
  }
  file = file[0];
  let fName = file.realName; //.replace(/^[\d]+_/, "");
  let fPath = path.resolve(
    __dirname,
    "../server/storage/files/" + file.sender + "/" + file.name
  );
  // console.log(`Downloading '${fName}' at '${fPath}'`);
  res.download(fPath, fName);
});

module.exports = router;
