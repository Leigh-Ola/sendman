// Require:
var postmark = require("postmark");
const fs = require("fs");
const { resolve } = require("path");
require("dotenv").config();

async function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.toString());
    });
  });
}

const modes = {
  password: {
    subject: "Your SendMan password has been reset",
    body: `./server/test/password.html`,
  },
};

// Send an email:
async function send(recipient, mode, codes = {}) {
  return new Promise((resolve, reject) => {
    // console.log(`Recipient: ${recipient}; Codes: ${JSON.stringify(codes)}`);
    let subject = modes[mode].subject;
    readFile(modes[mode].body)
      .then((body) => {
        //   console.log(subject);
        body = body.replace(/{{[^}]{1,25}}}/g, (str) => {
          let code = str.substr(2, str.length - 4);
          return codes[code];
        });
        //   console.log(body);
        //   return;

        var client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);
        return client
          .sendEmail({
            From: "dev@leighola.online",
            To: recipient,
            Subject: subject,
            HtmlBody: body,
            MessageStream: "outbound",
          })
          .then((res) => {
            console.log(res);
            console.log("success");
            resolve();
          })
          .catch((e) => {
            console.log(e);
            console.log("failure");
            reject();
          });
      })
      .catch((err) => {
        // error reading file
        console.log("error reading file");
        console.log(err);
        reject();
      });
  });
}

module.exports = { send };
