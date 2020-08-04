function rand(len = 30, addDate = true) {
  let letters = "abcdefghijklmnopqrstuvwxyz";
  let numbers = "0123456789";
  let all = [...letters, ...letters.toUpperCase(), ...numbers];
  let ans = "";
  if (addDate) {
    ans = String(new Date().getTime());
  }
  while (ans.length < len) {
    ans += all[Math.floor(Math.random() * all.length)];
  }
  return String(ans);
}

function createUser(o) {
  let obj = {
    username: o.username,
    numbers: [o.number],
    password: o.password,
    mainEmail: o.email,
    emails: [o.email],
    darkmode: false,
    joined: new Date().toISOString(),
    id: o.id,
    image: "/images/user/" + o.id,
    bio: "",
    lastSeen: "",
    privacy: {
      group: "friends",
      profile: "no one"
    },
    contacts: [],
    chats: []
  };
  return obj;
}

const fs = require("fs");
async function makeDir(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  randomString: rand,
  createUser,
  makeDir
};
