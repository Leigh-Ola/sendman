var temp_users = [
  {
    username: "Michael Jackson",
    image: "./kylie.jpg",
    count: 1,
    online: true,
    filename: "MyCoolFile.zip",
    time: "2 days ago",
    id: "nlgo5x18o53l5nl4zqgbxrjbythukc",
    type: "private",
    members: 2,
    muted: false,
    archived: false,
    emails: ["leo@gmail.com", "test@user.com"],
    numbers: ["08012345678", "09087654321"],
    bio: `This is my test bio.
      This is my test bio.
      This is my test bio.
      This is my test bio.
      This is my test bio.
      This is my test bio.`
  },
  {
    username: "Michael Jordan", //
    image: "./kylie.jpg", //
    count: 11,
    online: false,
    filename: "Image.png", //
    time: "11:55pm",
    id: "jhyflhj", //
    type: "private", //
    members: 2, //
    muted: true,
    archived: true,
    emails: ["aaa@bbb.com", "xxx@yyy.com"], //
    numbers: [], //
    bio: "I play basketball" //
  },
  {
    username: "Michael Faraday (G)",
    image: "./kylie.jpg",
    count: 0,
    online: true,
    filename: "Shape_Of_You.mp3",
    time: "Yesterday at 4:30pm",
    id: "qiueizl",
    type: "group",
    members: 5,
    muted: false,
    archived: false,
    members: ["Isaac Newton", "Albert Einstein"]
  }
];

let transfers = {
  hgkgkhv: [
    {
      link: "craplink.html",
      time: "2 hours ago",
      name: "MyFile.zip",
      size: "500mb",
      views: 2,
      isme: false
    },
    {
      link: "craplink2.html",
      time: "9 minutes ago",
      name: "MyFileVersionTwoImage.png",
      size: "1kb",
      views: 2,
      isme: true
    },
    {
      link: "craplink2b.html",
      time: "31 seconds ago",
      name: "MyFileVersionTwoImage.crap",
      size: "12.5kb",
      views: 2,
      isme: false
    },
    {
      link: "craplink3.html",
      time: "8 minutes ago",
      name: "MyFileVersionTwoSecretDocuments.txt",
      size: "75b",
      views: 2,
      isme: true
    },
    {
      link: "craplink4.html",
      time: "6 minutes ago",
      name: "MyRecording.wav",
      size: "1.5mb",
      views: 1,
      isme: true
    },
    {
      link: "craplink5.html",
      time: "5 minutes ago",
      name: "MyFileOriginalVideo.mp4",
      size: "31mb",
      views: 1,
      isme: true
    }
  ],
  qiueizl: [
    {
      link: "craplink.html",
      time: "19 days ago",
      name: "CompressedFile.zip",
      size: "219mb",
      views: 5,
      isme: false
    },
    {
      link: "craplink2.html",
      time: "19 days ago",
      name: "UncompressedFile.obb",
      size: "500mb",
      views: 1,
      isme: false
    }
  ]
};

var getData = async function(url, params = {}, returnErr = false) {
  return new Promise((resolve, reject) => {
    $.get(url, params, "json")
      .done(res => {
        // console.log("yay");
        // console.log(res);
        resolve(res.data);
      })
      .fail(e => {
        // console.log(`Error on the way to ${url}`);
        // console.log(e);
        if (e.status == 401) {
          resolve({ unauthorized: true });
        }
        try {
          if (returnErr) {
            let obj = JSON.parse(JSON.stringify(e));
            // console.log(obj.responseText);
            reject(obj.responseText);
          } else {
            reject(e);
          }
        } catch (error) {
          resolve([]);
        }
      });
  });
};

var fetchChats = async function(q = "", archive = false, returnErr) {
  return await getData(
    "/users/self/chats",
    { query: q, archive: archive },
    returnErr
  );
};
async function fetchContacts(q = "", returnErr) {
  return await getData("/users/self/contacts", { query: q }, returnErr);
}
async function fetchUsers(q = "", returnErr) {
  return await getData("/users", { query: q }, returnErr);
}
async function fetchTransfers(cid, returnErr) {
  return await getData("/transfers/" + cid, {}, returnErr);
}
async function fetchSelfData(key, returnErr) {
  return await getData("/users/self/" + key, {}, returnErr);
}

export { fetchChats, fetchContacts, fetchUsers, fetchTransfers, fetchSelfData };
