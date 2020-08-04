/*
 route for /newchat
*/
const path = require("path");
const fs = require("fs");
const express = require("express");
const router = express.Router();

const validator = require("../server/validate.js");
const database = require("../server/db");
const utils = require("../server/utils");

router.post("/private", async (req, res) => {
  let recipientId = req.body.id;
  var id = req.session.barrier.user.user_id;
  // id = "1594761107571q5eoq63lqs0y6u6f3";
  let db = database.connect("users");
  let rec = db.get(recipientId);
  let me = db.get(id);
  if (!rec.value()) {
    return res
      .status(400)
      .send(`User with id: '${recipientId}' does not exist`);
  }
  let recChats = rec.get("chats");
  let chatId = utils.randomString(30);
  let recObj = {
    type: "private",
    recipient: id,
    chatId
  };
  let myObj = {
    type: "private",
    recipient: recipientId,
    chatId
  };
  let exists = Boolean(
    recChats.filter({ recipient: id, type: "private" }).value().length
  );
  if (exists) {
    // console.log(id + " already conversing with " + recipientId);
    let recObj2 = recChats
      .filter({ recipient: id, type: "private" })
      .value()[0];
    if (recObj2) {
      recObj = recObj2;
    }
    recChats
      .remove(v => {
        return v.type == "private" && v.recipient == id;
      })
      .write();
    let myChats = me.get("chats");
    let myObj2 = myChats
      .filter({ recipient: recipientId, type: "private" })
      .value()[0];
    if (myObj2) {
      myObj = myObj2;
    }
    // console.log(myChats.value());
    myChats
      .remove(v => {
        // console.log(v);
        return v.type == "private" && v.recipient == recipientId;
      })
      .write();
  } else {
    // console.log(id + " have not yet conversed with " + recipientId);
    let chatDb = await database.connectChat(chatId);
    chatDb
      .setState({
        createdOn: new Date().toString(),
        createdBy: id,
        chatId: chatId,
        members: [id, recipientId],
        type: "private",
        transfers: [],
        muted: [],
        archived: [],
        pinned: []
      })
      .write();
  }
  let rc = rec.get("chats").value();
  rc.unshift(recObj);
  rec.set("chats", rc).write();
  let mc = me.get("chats").value();
  mc.unshift(myObj);
  me.set("chats", mc).write();
  if (exists) {
    // console.log(`Done >> Moved: '${id}' chatting with ${recipientId}`);
  } else {
    // console.log(
    //   `Done >> Started: ${chatId} >> '${id}' chatting with ${recipientId}`
    // );
  }
  res.status(200).send();
});

router.post("/group", async (req, res) => {
  let { name: groupName, id: recipientsId } = req.body;
  var id = req.session.barrier.user.user_id;
  // id = "1594761107571q5eoq63lqs0y6u6f3";
  let chatId = utils.randomString(30);
  let members = recipientsId.concat(id);

  let isGroupNameValid = Boolean(validator.groupName(groupName).length == 0);
  if (!isGroupNameValid) {
    return res.status(200).send(`Invalid group name : '${groupName}'`);
  }

  let db = database.connect("users");
  let me = db.get(id);
  let obj = {
    type: "group",
    recipients: members,
    chatId
  };

  let chatDb = await database.connectChat(chatId);
  chatDb
    .setState({
      createdOn: new Date().toISOString(),
      createdBy: id,
      groupName,
      image: "/images/group/default",
      chatId: chatId,
      members: members,
      type: "group",
      transfers: [],
      muted: [],
      archived: [],
      pinned: []
    })
    .write();

  for (let recipientId of recipientsId) {
    let rec = db.get(recipientId);
    if (!rec.value()) {
      return res
        .status(400)
        .send(`User with id: '${recipientId}' does not exist`);
    }
    let whoCanAdd = String(rec.get("privacy.group").value()).toLowerCase();
    // anyone, friends, no one
    let allowed = whoCanAdd == "anyone" ? true : false;
    let rc = rec.get("chats").value();
    if (whoCanAdd == "friends") {
      for (let chat of rc) {
        if (chat.type == "private" && chat.recipient == id) {
          allowed = true;
          break;
        }
      }
    }
    if (!allowed) {
      let rn = rec.get("username").value();
      return res
        .status(400)
        .send(`You are not allowed to add ${rn} to a group`);
    }
    rc.unshift(obj);
    rec.set("chats", rc).write();
  }

  let mc = me.get("chats").value();
  mc.unshift(obj);
  me.set("chats", mc).write();

  // console.log(
  //   `Done >> Started: group ${groupName} : ${chatId} >> '${id}' chatting with ${members}`
  // );
  res.status(200).send();
});

module.exports = router;
