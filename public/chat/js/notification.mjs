import { default as Notify } from "../../Libs/Notify/notify.js";

function wrapper() {
  var proceed = false;
  var queue = [];

  let el = Sizzle.matches("#logoheader")[0];
  // console.log(el.outerHTML);
  el.addEventListener("click mousedown mouseup", () => {
    console.log("clicked");
    if (!Notify.needsPermission) {
      console.log("Permission not required");
      console.log(`Supported? ${Notify.isSupported()}`);
      proceed = true;
    } else if (Notify.isSupported()) {
      console.log("Permission required");
      Notify.requestPermission(
        () => {
          proceed = true;
          queue.forEach(v => {
            show(v);
          });
        },
        () => {
          console.log("Permission denied");
        }
      );
    }
  });

  function show(obj) {
    console.log(`Showing notification : ${JSON.stringify(obj)}`);
    var notification = new Notify(obj.title, { body: obj.body });
    notification.show();
  }

  return {
    add: function(obj = { title: "", body: "" }) {
      if (proceed) {
        show(obj);
      } else {
        queue.push(obj);
      }
    }
  };
}

export { wrapper as Notif };
