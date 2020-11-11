/*
 route for /users
*/
const express = require("express");
const router = express.Router();

const validator = require("../server/validate.js");
const database = require("../server/db");
const _ = require("lodash");

const availableParamsForMe = [
  "id",
  "emails",
  "numbers",
  "privacy",
  "image",
  "chats",
  "contacts",
  "bio",
  "username",
  "muted",
  "archived",
  "pinned",
  "lastSeen",
  "darkmode",
  "createdOn",
];
const availableParamsForAll = [
  "id",
  "emails",
  "numbers",
  "image",
  "bio",
  "username",
  "lastSeen",
  "createdOn",
];

router.get("/", (req, res) => {
  let searhQuery = String(req.query.query).slice(0, 20);
  if (!searhQuery) {
    return res.status(200).send({ done: false, error: "Missing query" });
  }
  if (searhQuery.length < 3) {
    return res.status(200).send({ done: false, error: "Query is too short" });
  }
  var id = res.locals.barrier.user.user_id;
  // id = "1594761107571q5eoq63lqs0y6u6f3";

  let db = database.connect("users");
  let val = Object.values(db.getState());
  val = filter(val, searhQuery, id).slice(0, 20);
  console.log(val.length);
  val = val.map((user) => {
    let ans = {};
    availableParamsForAll.forEach((v) => {
      ans[v] = user[v];
    });
    return ans;
  });
  // console.log(val.length);
  res.status(200).json({ done: true, data: val });
});

function filter(arr, q, self) {
  if (!q) {
    return arr;
  }
  q = String(q).toLowerCase();
  let ans = [];
  for (let user of arr) {
    if ((self && user.id == self) || !user) {
      continue;
    }

    // search by names
    let name = user.type == "group" ? user.groupname : user.username;
    if (name.toLowerCase().split(" ").includes(q)) {
      ans.push(user);
      continue;
    }
    if (user.type == "group") {
      continue;
    }

    // search by email
    let foundByEmail = false;
    let emails = user.emails;
    for (let email of emails) {
      if (String(email).indexOf(q) >= 0) {
        ans.push(user);
        foundByEmail = true;
        continue;
      }
    }
    if (foundByEmail) {
      continue;
    }

    // search by number (query must be at least 5 chars long)
    if (!isNaN(Number(q)) && q.length >= 5) {
      let numbers = user.numbers;
      for (let num of numbers) {
        if (String(num).indexOf(q) >= 0) {
          ans.push(user);
          continue;
        }
      }
    }
  }
  return ans;
}

router.get("/:id", (req, res) => {
  // console.log("x");
  let isSelf = req.params.id == "self";
  let selfId = res.locals.barrier.user.user_id;
  // let selfId = "1594761107571q5eoq63lqs0y6u6f3";

  if (isSelf) {
    var id = selfId;

    let db = database.connect("users");
    let userDb = db.get(id);
    let user = userDb.pick(availableParamsForMe).value();
    user.online = true;
    res.status(200).json(user);
  } else {
    var id = req.params.id;

    let db = database.connect("users");
    let userDb = db.get(id);
    let user = userDb.pick(availableParamsForAll).value();
    user.online = isOnline(user.lastSeen);
    user = privatize(user, userDb, selfId);
    res.status(200).json(user);
  }
});

router.get("/self/:key", async (req, res) => {
  let { query: searhQuery, archive } = req.query;
  archive = String(archive) == "true";

  let key = req.params.key.toLowerCase();
  var id = res.locals.barrier.user.user_id;
  // id = "1594761107571q5eoq63lqs0y6u6f3";

  let allowed = availableParamsForMe.slice();
  if (!allowed.includes(key)) {
    return res
      .status(200)
      .json({ done: false, error: `'${key}' cannot be fetched` });
  }

  let db = database.connect("users");
  let val = db.get(id + "." + key).value();
  if (key == "chats") {
    // console.log(`chats => archives? ${archive}`);
    val = await getUsers(val, db, id);
    // console.log(`chats : ${val.length}`);
    if (searhQuery) {
      // console.log(searhQuery);
      val = filter(val, searhQuery);
    }
    // console.log(`chats : ${val.length}`);
    let newVal = [];
    val.forEach((v, i) => {
      // console.log(`${v.archived} == ${archive}`);
      if (v.archived == archive) {
        newVal.push(v);
      }
    });
    val = newVal;
    // console.log(`chats : ${val.length}`);
  }
  // console.log(`${archive ? "Archived" : "Unarchived"} chats => ${val.length} values`);
  res.status(200).json({ done: true, data: val });
});

async function getUsers(arr, db, id) {
  let ans = [];
  let pinned = [];

  for (let ui in arr) {
    let u = arr[ui];
    if (u.type == "private") {
      try {
        let chat = db.get(u.recipient);
        let user = chat.pick(availableParamsForAll).value();
        // user = current recipient ( chat.recipient );
        if (!!user) {
          let chatDb = await database.connectChat(u.chatId);
          let transfers = chatDb.get("transfers");
          let lastFile = transfers.last();
          // console.log("private " + u.chatId);
          user.count = getUnseenCount(transfers, id);
          user.type = u.type;
          user.chatId = u.chatId;
          user.muted = chatDb.get("muted").value().includes(id);
          user.archived = chatDb.get("archived").value().includes(id);
          let isPinned = chatDb.get("pinned").value().includes(id);
          user.pinned = isPinned ? true : false;
          user.members = chatDb.get("members").value().length;
          user.filename = lastFile.get("realName").value();
          user.time = lastFile.get("time").value();
          user.online = isOnline(user.lastSeen);
          user = privatize(user, chat, id);
          if (isPinned) {
            pinned.push(user);
          } else {
            ans.push(user);
          }
        }
      } catch (error) {
        // ???
      }
    } else if (u.type == "group") {
      try {
        let user = {};
        // ^ no image, bio, numbers, emails
        let chatDb = await database.connectChat(u.chatId);
        let transfers = chatDb.get("transfers");
        let lastFile = transfers.last();
        // console.log("group " + u.chatId);
        user.count = getUnseenCount(transfers, id);
        user.type = u.type;
        user.id = user.chatId = u.chatId;
        user.createdOn = chatDb.get("createdOn");
        user.muted = chatDb.get("muted").value().includes(id);
        user.archived = chatDb.get("archived").value().includes(id);
        let isPinned = chatDb.get("pinned").value().includes(id);
        user.pinned = isPinned ? true : false;
        user.members = chatDb.get("members").value();
        user.members = user.members.map((v) => {
          return db.get(v + ".username").value();
        });
        user.filename = lastFile.get("realName").value();
        user.time = lastFile.get("time").value();
        user.groupname = chatDb.get("groupName").value();
        user.image = chatDb.get("image");
        if (isPinned) {
          pinned.push(user);
        } else {
          ans.push(user);
        }
      } catch (error) {
        // ???
      }
    }
  }
  return pinned.concat(ans);
}

function getUnseenCount(tf, id) {
  let transfers = tf.value().slice();
  let count = 0;
  // console.log(transfers);
  if (transfers) {
    transfers.forEach((transfer) => {
      // count++ if id is not in transfer.seen
      if (transfer && !transfer.seen.includes(id)) {
        count++;
      }
    });
  }
  return count;
}

function privatize(user, userDb, requesterId) {
  let { group, profile } = userDb.get("privacy").value();
  profile = profile.toLowerCase();
  if (profile) {
    if (profile == "no one") {
      // console.log("no one");
      user.emails = [];
      user.numbers = [];
    } else if (profile == "friends") {
      let isFriend = Boolean(
        userDb
          .get("chats")
          .filter({ type: "private", recipient: requesterId })
          .value().length
      );
      // console.log(`friends? ${isFriend}`);
      if (!isFriend) {
        user.emails = [];
        user.numbers = [];
      }
    }
  }
  // console.log(user);
  return user;
}

function isOnline(lastSeen) {
  if (!lastSeen) {
    return false;
  }
  let then = new Date(lastSeen);
  let now = new Date();
  let timePassed = now.getTime() - then.getTime();
  return timePassed < 1000 * 10; // 1000 * 10 => 10 secs
}

router.post("/self/:key", async (req, res) => {
  //  console.log(req.body);
  let key = String(req.params.key).toLowerCase();
  let val = req.body.value;
  let remove = req.body.remove;
  var id = res.locals.barrier.user.user_id;
  // id = "1594761107571q5eoq63lqs0y6u6f3";

  let db = database.connect("users");
  let writable = [
    "emails",
    "numbers",
    "privacy",
    "password",
    "bio",
    "username",
    "muted",
    "archived",
    "darkmode",
    "pinned",
  ];
  if (!writable.includes(key)) {
    return res.status(400).send(`Invalid parameter : '${key}'`);
  }
  // console.log(`key: '${key}' >> val: '${val}' >> remove : '${remove}'`);

  function checkChatExists(cid) {
    return id &&
      Boolean(
        db
          .get(id + ".chats")
          .find({ chatId: cid })
          .value()
      )
      ? []
      : [`Unable to get chat '${cid}'`];
  }
  function nullValidator(val) {
    return [];
  }
  switch (key) {
    case "username":
      var validate = validator.username;
      break;
    case "bio":
      var validate = validator.bio;
      break;
    case "emails":
      var validate = validator.email;
      break;
    case "numbers":
      var validate = validator.number;
      break;
    case "password":
      var validate = validator.changePassword;
      break;
    case "privacy":
      var validate = validator.privacy;
      break;
    case "muted":
      var validate = checkChatExists;
      break;
    case "archived":
      var validate = checkChatExists;
      break;
    case "pinned":
      var validate = checkChatExists;
      break;
    case "darkmode":
      var validate = nullValidator;
      break;
    default:
      break;
  }
  let add = true,
    rem = false;
  let isValArr = ["emails", "numbers", "muted", "archived", "pinned"].includes(
    key
  );
  let isChatSetting = ["muted", "archived", "pinned"].includes(key);
  let errors = validate(val);
  if (errors.length) {
    add = false;
  }
  if (isValArr && remove && Boolean(remove.length)) {
    rem = true;
  }

  if (!add && !rem) {
    return res
      .status(400)
      .send(isValArr ? "Invalid values for 'value' or 'remove'." : errors[0]);
  }
  if (add) {
    if (isValArr) {
      val = String(val).trim();
      if (isChatSetting) {
        let chatDb = await database.connectChat(val);
        let arr = chatDb.get(key).value();
        // console.log(`adding ${id} to ${key}`);
        if (!arr.includes(id)) {
          arr.push(id);
          chatDb.set(key, arr).write();
        }
      } else {
        let arr = db.get(id + "." + key).value();
        if (!arr.includes(val)) {
          arr.push(val);
          db.set(id + "." + key, arr).write();
        }
      }
    } else if (key == "password") {
      let old = db.get(id + "." + key).value();
      if (old != val.old) {
        return res
          .status(202)
          .json({ done: false, error: `Incorrect old password.` });
      }
      val = String(val.new).trim();
      db.set(id + "." + key, val).write();
    } else if (key == "privacy") {
      let obj = { group: val.group, profile: val.profile };
      db.get(id + "." + key)
        .assign(obj)
        .write();
    } else {
      val = String(val).trim();
      db.set(id + "." + key, val).write();
    }
    // console.log(`added ${val}`);
  }
  if (rem) {
    for (r of remove) {
      let rval = String(r).trim();
      if (isChatSetting) {
        let chatDb = await database.connectChat(rval);
        let arr = chatDb.get(key).value();
        if (arr.includes(id)) {
          arr.splice(arr.indexOf(id), 1);
          chatDb.set(key, arr).write();
        }
      } else {
        let arr = db.get(id + "." + key).value();
        if (arr.includes(rval)) {
          arr.splice(arr.indexOf(rval), 1);
          db.set(id + "." + key, arr).write();
        }
      }
    }
  }
  res.status(200).json({ done: true });
});

module.exports = router;
