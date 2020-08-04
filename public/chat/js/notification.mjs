import { default as Notify } from "../../Libs/Notify/notify.js";

function wrapper() {
  var proceed = false;
  var queue = [];

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
    },
    initialize: function() {
      // if (!Notify.isSupported()) {
      //   return;
      // }
      if (Notify.needsPermission) {
        Notify.requestPermission(
          () => {
            proceed = true;
            // console.log("Permission granted");
            queue.forEach(v => {
              show(v);
            });
          },
          () => {
            // console.log("Permission denied");
          }
        );
      } else {
        proceed = true;
      }
    },
    isReady: () => {
      return proceed;
    },
    Notify: () => {
      return Notify;
    }
  };
}

export { wrapper as Notif };
