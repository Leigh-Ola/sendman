var extension_groups = {
  "image.png": [
    "png",
    "jpg",
    "jpeg",
    "ai",
    "bmp",
    "gif",
    "ico",
    "ps",
    "psd",
    "svg",
    "tif",
    "tiff"
  ],
  "video.png": [
    "mp4",
    "3g2",
    "3gp",
    "avi",
    "flv",
    "h264",
    "m4v",
    "mkv",
    "mov",
    "mpg",
    "mpeg",
    "rm",
    "swf",
    "vob",
    "wmv"
  ],
  "audio.png": [
    "wav",
    "mp3",
    "aif",
    "cda",
    "mid",
    "midi",
    "mpa",
    "ogg",
    "wma",
    "wpl"
  ],
  "document.png": ["txt", "doc", "odt", "docx", "pdf", "tex", "wpd"],
  "zip.png": ["zip", "7z", "arj", "deb", "pkg", "rar", "rpm", "gz", "z"],
  "system.png": [
    "bak",
    "cab",
    "cfg",
    "cpl",
    "cur",
    "dll",
    "dmp",
    "drv",
    "icns",
    "ico",
    "ini",
    "lnk",
    "msi",
    "sys",
    "tmp"
  ],
  "spreadsheet.png": ["ods", "xls", "xlsm", "xlsx"],
  "code.png": [
    "c",
    "class",
    "cpp",
    "cs",
    "h",
    "java",
    "py",
    "pl",
    "sh",
    "swift",
    "vb"
  ],
  "presentation.png": ["key", "odp", "pps", "ppt", "pptx"],
  "internet.png": [
    "asp",
    "aspx",
    "cer",
    "cfm",
    "cgi",
    "pl",
    "css",
    "htm",
    "html",
    "js",
    "jsp",
    "part",
    "php",
    "rss",
    "xhtml"
  ],
  "font.png": ["fnt", "fon", "otf", "ttf"],
  "apk.png": ["apk", "bat", "bin", "com", "exe", "gadget", "jar", "msi", "wsf"],
  "email.png": ["email", "eml", "emlx", "msg", "oft", "ost", "pst", "vcf"],
  "db.png": [
    "csv",
    "dat",
    "db",
    "dbf",
    "log",
    "mdb",
    "sav",
    "sql",
    "tar",
    "xml"
  ],
  "disc.png": ["dmg", "iso", "toast", "vcd"]
};

let exposed = {
  parseFileName: function(filename) {
    let fn = String(filename);
    if (fn.indexOf(".") < 0) {
      return {
        name: fn,
        extension: ""
      };
    }
    let spl = fn.split(".");
    let name = spl.slice(0, spl.length - 1).join(".");
    let extension = spl.reverse()[0];
    return { name, extension };
  },
  cropText: function(txt, len = 20) {
    let text = String(txt);
    if (text.length <= len) {
      return text;
    }
    let ans = text.substr(0, len - 5) + "..." + text.substr(text.length - 5);
    return ans;
  },
  fileThumbnail: function(extension) {
    let ans = "";
    let groups = extension_groups;
    for (let thumb in groups) {
      if (groups[thumb].includes(extension)) {
        ans = "./img/" + thumb;
        break;
      }
    }
    ans = !ans ? "./img/unknown.png" : ans;
    return ans;
  },
  passedTime: function(then) {
    if (!then) {
      return "";
    }
    let now = new Date();
    var m1 = moment(then);
    var m2 = moment(now.toISOString());
    let diff = moment.preciseDiff(m1, m2);
    diff = diff.split(" ");
    let ans = "",
      index = 0;
    for (let ind in diff) {
      let i = Number(ind);
      if (i % 2 == 0 && Number(diff[i]) != 0) {
        index = i;
        break;
      }
    }
    ans =
      diff[index + 1].indexOf("second") > -1
        ? "Moments ago"
        : `${diff[index]} ${diff[index + 1]} ago`;
    return ans;
  }
};

export { exposed as utilities };
