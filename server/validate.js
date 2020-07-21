function normal(uname, pwd, eml) {
  var err = [];
  err = err.concat(username(uname));
  err = err.concat(email(eml));
  err = err.concat(password(pwd));
  return err;
}

function username(username) {
  let err = [];
  username = String(username);
  if (/[^a-zA-Z\s-_]+/g.test(username)) {
    err.push("Username contains invalid characters");
  }
  if (username.length < 5) {
    err.push("Username is too short");
  }
  if (username.length > 20) {
    err.push("Username is too long");
  }
  return err;
}

function password(password) {
  let err = [];
  password = String(password);
  if (/[^a-zA-Z0-9-_\[\]\(\)!\.,\+\*]+/g.test(password)) {
    err.push("Password contains invalid characters");
  }
  if (password.length < 5) {
    err.push("Password is too short");
  }
  if (password.length > 20) {
    err.push("Password is too long");
  }
  return err;
}

function bio(bio) {
  let err = [];
  bio = String(bio);
  if (bio.length < 3) {
    err.push("Bio is too short");
  }
  if (bio.length > 220) {
    err.push("Bio is too long");
  }
  return err;
}

function email(email) {
  let err = [];
  email = String(email);
  if (!/^([\S]+)@(([A-Za-z]+)(\.))+([A-Za-z]+)+$/g.test(email)) {
    err.push("Invalid Email");
  }
  return err;
}

function number(num) {
  let err = [];
  num = Number(num);
  if (!/^([0-9]{7,20})$/g.test(num)) {
    err.push("Invalid number");
  }
  return err;
}

function privacy(obj) {
  let err = [],
    count = 0;
  for (let o in obj) {
    let val = String(obj[o]).toLowerCase();
    if (o == "group") {
      count++;
      if (!["anyone", "friends", "no one"].includes(val)) {
        err.push("Invalid value for 'group'");
      }
    } else if (o == "profile") {
      count++;
      if (!["everyone", "friends", "no one"].includes(val)) {
        err.push("Invalid value for 'profile'");
      }
    }
  }
  if (count == 0) {
    err.push(`Keys must include at least one of 'group' or 'profile'.`);
  }
  return err;
}

function changePassword(obj) {
  let err = [];
  let required = ["old", "new"];
  for (let r of required) {
    if (Object.keys(obj).indexOf(r) < 0) {
      err.push("Keys must include " + r);
    }
  }
  let pwerr = password(obj.new);
  if (pwerr.length) {
    for (let i in pwerr) {
      pwerr[i] = `New ${pwerr[i].toLowerCase()}`;
    }
  }
  err = err.concat(pwerr);
  return err;
}

function groupName(gname) {
  let err = [];
  gname = String(gname);
  if (/[^a-zA-Z0-9_\-\s]/g.test(gname)) {
    err.push("Group name contains invalid characters");
  }
  if (gname.length < 4) {
    err.push("Group name is too short");
  }
  if (gname.length > 20) {
    err.push("Group name is too long");
  }
  return err;
}

module.exports = {
  normal,
  username,
  password,
  bio,
  email,
  number,
  privacy,
  changePassword,
  groupName
};
