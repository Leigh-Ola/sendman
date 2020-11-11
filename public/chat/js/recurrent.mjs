function wrapper(timeout) {
  let funcs = {};
  let fakeFuncs = {};

  function caller() {
    this.timeout = timeout;
    this.count = 0;

    var self = this;

    function funcCaller() {
      self.count++;
      for (let f of Object.values(funcs)) {
        let context = f[1] || this,
          args = f[2] || [];
        f[0].apply(context, args);
      }
      for (let i in fakeFuncs) {
        funcs[i] = fakeFuncs[i];
      }
      if (self.count >= 1) {
        // return;
      }
      setTimeout(funcCaller, self.timeout);
    }
    setTimeout(funcCaller, self.timeout);
  }
  caller.prototype = {
    add: function (obj) {
      if (obj instanceof Array) {
        fakeFuncs[new Date().getTime()] = obj;
      } else {
        for (let i in obj) {
          let args = obj[i][1];
          obj[i][1] == args instanceof Array ? args : [];
          fakeFuncs[i] = obj[i];
        }
      }
    },
    remove: function (key) {
      let f = funcs[key];
      delete funcs[key];
      return f;
    },
    get: function (key) {
      let f = funcs[key];
      return f;
    },
  };
  return new caller();
}

export { wrapper as Recurrent };
