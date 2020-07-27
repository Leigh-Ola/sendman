const fs = require("fs");
const path = require("path");
const lowdb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

function connect(file) {
  let filepath = path.resolve(__dirname, "./database", file + ".json");
  fs.closeSync(fs.openSync(filepath, "a"));
  const adapter = new FileSync(filepath);
  const db = lowdb(adapter);
  return db;
}
async function connectChat(file) {
  function verify(fp) {
    return new Promise((resolve, reject) => {
      fs.access(fp, notExist => {
        if (notExist) {
          fs.open(fp, "w+", (err, fd) => {
            if (!err) {
              fs.close(fd, err2 => {
                if (err2) {
                  reject("Error closing file: " + err2);
                } else {
                  resolve();
                }
              });
            } else {
              reject("Error opening file: " + err);
            }
          });
        } else {
          resolve();
        }
      });
    });
  }
  let filepath = path.resolve(__dirname, "./storage/chats", file + ".json");
  fs.closeSync(fs.openSync(filepath, "a"));

  return verify(filepath)
    .then(() => {
      const adapter = new FileSync(filepath, {
        defaultValue: {}
      });
      const db = lowdb(adapter);
      return db;
    })
    .catch(e => {
      // console.log(e);
      return new Error("Error Initializing chat database : " + file);
    });
}

module.exports = {
  connect: connect,
  connectChat: connectChat
};
