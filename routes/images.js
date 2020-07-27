/*
 route for /images
*/
const path = require("path");
const express = require("express");
const glob = require("glob");
const router = express.Router();

router.get("/:type/:id", (req, res) => {
  let id = req.params.id;
  let type = req.params.type == "group" ? "group" : "user";
  let folder = path.resolve(__dirname, "../server/storage/files/" + id);
  let pattern = folder + "/image.*";
  // console.log(pattern);
  glob(pattern, (err, files) => {
    if (err || !files.length) {
      var fp = path.resolve(__dirname, "../server/images/" + type + ".png");
    } else {
      var fp = path.resolve(__dirname, files[0]);
    }
    // console.log(fp);
    res.sendFile(fp, err => {});
  });
});

module.exports = router;
