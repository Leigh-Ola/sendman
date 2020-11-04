/*
 route for /upload
*/
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const glob = require("glob");
const formidable = require("formidable");
const express = require("express");
const router = express.Router();

const database = require("../server/db");
const utils = require("../server/utils");

router.post("/file", async (req, res, next) => {
  if (!res.locals.barrier.authenticated && false) {
    return res.status(401).send("Unauthorized");
  }
  var id = res.locals.barrier.user.user_id;
  // id = "1594761107571q5eoq63lqs0y6u6f3";

  // console.log("Receiving...");
  let fields = { count: 0 };
  let responded = false;
  let requiredFields = ["chatid", "type"];

  async function handle() {
    new formidable({
      maxFileSize: 1024 * 1024 * 50, // (1024*1024*50) = 50mb
    })
      .parse(req)
      .on("fileBegin", (name, file) => {
        if (!/^[A-Za-z0-9\s_\+\-\.]+$/g.test(name)) {
          name = name.replace(/[^A-Za-z0-9\s_\+\-\.]/g, "");
        }
        // console.log(`Starting to receive ${name}`);
        let timestamp = new Date().getTime() + "_";
        let fname = timestamp + name;
        file.path = path.resolve(
          __dirname,
          "../server/storage/files/temp/",
          fname
        );
        fields.name = fname;
        if (++fields.count > 1 && !responded) {
          res.status(400).send("One file limit exceeded");
          responded = true;
        }
      })
      .on("progress", (received, expected) => {
        if (expected / received <= 2) {
          //res.status(500).send("Intentionally Cancelled");
        }
      })
      .on("field", (key, val) => {
        let k = String(key).toLowerCase();
        if (!requiredFields.includes(k)) {
          if (!responded) {
            let err = `Required fields are : ${requiredFields.join(
              ","
            )}; Got '${k}'`;
            res.status(400).send(err);
            responded = true;
          }
        } else {
          fields[k] = val;
          // console.log(`${k} >> ${val}`);
        }
      })
      .on("file", (name, file) => {
        // console.log(`Uploaded '${name}' : to ${file.path} [${file.size}]`);
        fields.fileEntered = true;
        fields.size = file.size;
        fields.path = file.path;
      })
      .on("error", (err) => {
        // console.log("Error uploading");
        responded = true;
        if (!responded) {
          res.status(500).type("text").send(`Upload Error : ${err}`);
        }
      })
      .on("end", (x) => {
        // all done
        let valid = true;
        let oldPath = path.resolve(
          __dirname,
          "../server/storage/files/temp/",
          fields.name
        );
        let newPath = path.resolve(
          __dirname,
          "../server/storage/files/" + id + "/",
          fields.name
        );
        let fieldsK = Object.keys(fields);
        requiredFields.forEach((v) => {
          if (!fieldsK.includes(v)) {
            valid = false;
          }
        });
        if (!responded) {
          res.status(200).type("text").send("Upload successful");
        } else {
          valid = false;
        }
        // console.log(`Done. ID : ${id}`);
        if (fields.fileEntered && valid) {
          // move to appropriate place
          // console.log(`Moving to folder >> ${newPath}`);
          fs.rename(oldPath, newPath, (err) => {
            if (!err) {
              update(fields, id);
            }
            // console.log("Failure moving file : "+err);
          });
        } else {
          // delete the temp file : fields.name;
          // console.log(`Removing from temp >> ${oldPath}`);
          fs.unlink(oldPath, (err) => {
            // console.log("Failure deleting file : "+err);
          });
        }
      });
  }

  handle().catch((error) => {
    // console.log(`Error sending : ${error}`);
  });
});

async function update(info, sender) {
  let chatDb = await database.connectChat(info.chatid);
  let db = await database.connect("users");

  // update chat datanbase
  let transfers = chatDb.get("transfers").value();
  let size = normalizeSize(info.size);
  let fid = utils.randomString(20, false);
  let time = moment().utcOffset(0).format();
  /**
   * ISO 8601 format => yy-mm-ddThh:mm:ssZ
   * 2020-07-15T11:00:48+01:00
   * */

  transfers.push({
    link: `/download/${info.chatid}/${fid}`,
    time: time,
    name: info.name,
    realName: info.name.replace(/^[\d]+_/, ""),
    sender: sender,
    senderimage: "/images/user/" + sender,
    size: size,
    fileId: fid,
    seen: [sender],
  });
  chatDb.set("transfers", transfers).write();
  let chatMembers_butMe = chatDb.get("members").without(sender).value();

  // update sender's chats
  let me = db.get(sender);
  let myChats = me.get("chats");
  let myObj = myChats
    .filter({ type: info.type, chatId: info.chatid })
    .value()[0];
  myChats
    .remove((v) => {
      return v.type == info.type && v.chatId == info.chatid;
    })
    .write();
  let mc = me.get("chats").value();
  mc.unshift(myObj);
  me.set("chats", mc).write();

  // update receivers' chats
  for (let recId of chatMembers_butMe) {
    let rec = db.get(recId);
    let recChats = rec.get("chats");
    let recObj = recChats
      .filter({ type: info.type, chatId: info.chatid })
      .value()[0];
    recChats
      .remove((v) => {
        return v.type == info.type && v.chatId == info.chatid;
      })
      .write();
    let rc = rec.get("chats").value();
    rc.unshift(recObj);
    rec.set("chats", rc).write();
  }
  /**
     * link: "craplink.html",
      time: "2 hours ago",
      name: "MyFile.zip",
      size: "500mb",
      views: 2,
      isme: false
     */
}

function normalizeSize(bytes) {
  let exts = ["kb", "mb", "gb", "tb"];
  let ext = "b";
  bytes = Number(bytes);
  function loop(s, i) {
    let size = s / 1024;
    if (String(Math.round(size)).length > 3 && i < exts.length) {
      return loop(size, ++i);
    } else {
      return i >= exts.length
        ? [s, exts[exts.length - 1]]
        : [Number(size), exts[i]];
    }
  }
  if (String(Math.round(bytes)).length < 4) {
    return bytes + ext;
  } else {
    let ans = loop(bytes, 0);
    let sz = String(ans[0]);
    if (sz.indexOf(".") > 0) {
      sz = Number(sz.substring(0, sz.indexOf(".") + 5));
      ans[0] = sz.toFixed(2);
    }
    return `${ans[0]}${ans[1]}`;
  }
}

router.post("/image", async (req, res, next) => {
  if (!res.locals.barrier.authenticated && false) {
    return res.status(401).send("Unauthorized");
  }
  var id = res.locals.barrier.user.user_id;
  // id = "1594761107571q5eoq63lqs0y6u6f3";

  // console.log("Receiving image...");
  let responded = false;
  let validExtensions = ["png", "jpg", "jpeg"];
  let fields = {};

  async function handle() {
    new formidable({
      maxFileSize: 1024 * 1024 * 5, // (1024*1024*50) = 50mb
    })
      .parse(req)
      .on("fileBegin", (name, file) => {
        // console.log(`Starting to receive image : ${name}`);
        let ext = getExtension(name);
        let fname = "tempImage." + ext;
        file.path = path.resolve(
          __dirname,
          "../server/storage/files/" + id + "/",
          fname
        );
        fields.extension = ext;
        fields.name = fname;
        if (!validExtensions.includes(ext) && !responded) {
          res.status(400).send("Invalid file extension");
          responded = true;
        }
      })
      .on("file", (name, file) => {
        // console.log(`Uploaded image : to ${file.path} [${file.size}]`);
        fields.fileEntered = true;
        fields.path = file.path;
      })
      .on("error", (err) => {
        // console.log("Error uploading image");
        if (!responded) {
          responded = true;
          res.status(500).type("text").send(`Upload Error : ${err}`);
        }
      })
      .on("end", (x) => {
        // all done
        let valid = true;
        let oldPath = path.resolve(
          __dirname,
          "../server/storage/files/" + id + "/",
          fields.name
        );
        let newPath = path.resolve(
          __dirname,
          "../server/storage/files/" + id + "/image." + fields.extension
        );
        if (!responded) {
          res.status(200).type("text").send("Upload successful");
        } else {
          valid = false;
        }
        // console.log(`Done. ID : ${id}`);

        if (fields.fileEntered && valid) {
          let folder = path.resolve(__dirname, "../server/storage/files/" + id);
          let pattern = folder + "/image.*";
          glob(pattern, (err, files) => {
            if (files.length && !err) {
              fs.unlink(files[0], (err) => {
                // console.log("Failure deleting file : "+err);
              });
            }
            // move to appropriate place
            // console.log(`Moving image to folder >> ${newPath}`);
            fs.rename(oldPath, newPath, (err) => {
              if (!err) {
                // update(fields, id); // < ==
              }
              // console.log("Failure moving file : "+err);
            });
          });
        } else {
          // delete the temp file : fields.name;
          // console.log(`Removing image from temp >> ${oldPath}`);
          fs.unlink(oldPath, (err) => {
            // console.log("Failure deleting file : "+err);
          });
        }
      });
  }

  handle().catch((error) => {
    // console.log(`Error sending : ${error}`);
  });
});

function getExtension(filename = "") {
  return String(filename).split(".").reverse()[0].toLowerCase();
}

module.exports = router;
