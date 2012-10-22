
var log = function () {

  var logLevel = 0;
  var debugLog = [];

  var levels = {
    ERROR : 0,
    WARNING : 1,
    INFO : 2,
    DEBUG : 3
  };
  
  var getLogs = function() {
    return debugLog;
  }

  var setLogLevel = function (level) {
    logLevel = (typeof level === 'undefined') ? levels.ERROR : level;

    /* Returns function to log event "fn" at the specified log level */
    var getFunction = function (fn, logLevel) {
    
      /* Returns function to obtain JSON of event "fn" */
      var getEventInfo = function (fn, args) {
        var res = functionsMap[fn].apply(null, Array.prototype.slice.call(args));
        info(JSON.stringify(res));
        return res; 
      }

      if (logLevel === levels.DEBUG) {
        return function () {
          var res = getEventInfo(fn, arguments);
          debugLog.push(res);
          return res; 
        };
      } else if (logLevel === levels.INFO) {
        return function () {
          var res = getEventInfo(fn, arguments);
          return res; 
        };
      } else {
        return function () { }; 
      }
    }

    for (var fn in functionsMap) {
      if (functionsMap.hasOwnProperty(fn)) {
         this[fn] = getFunction(fn, logLevel);
      }
    }
  };


  var functionsMap = {
    setCenter: function (center) {
      return { "category": "change-center",
                 "action": "set",
                 "center": center};
    },
    setZoom: function (zoom) {
      return { "category": "change-zoom",
                 "action": "set",
                   "zoom": zoom };
    },
    setState: function (center, zoom) {
      return { "category": "change-state",
                 "action": "set",
                 "center": center,
                   "zoom": zoom };
    },
    receivedCenter: function (center) {
      return { "category": "change-center",
                 "action": "receive",
                 "center": center};
    },
    receivedZoom: function (zoom) {
      return { "category": "change-zoom",
                 "action": "receive",
                   "zoom": zoom };
    },
    receivedState: function (center, zoom) {
      return { "category": "change-state",
                 "action": "receive",
                 "center": center,
                   "zoom": zoom };
    },
    sentCenter: function (center) {
      return { "category": "change-center",
                 "action": "send",
                 "center": center};
    },
    sentZoom: function (zoom) {
      return { "category": "change-zoom",
                 "action": "send",
                   "zoom": zoom };
    },
    sentState: function (center, zoom) {
      return { "category": "change-state",
                 "action": "send",
                 "center": center,
                   "zoom": zoom };
    }
  };


  var stamp = function (msg) {
    return "[" + new Date() + "] " + msg; 
  };



  // logs information messages
  var info = function (msg) { 
    if (logLevel >= levels.INFO) {
        console.log(stamp(msg));
    }
  };

  // logs warning messages
  var warn = function (msg) {
    if (logLevel >= levels.WARNING) {
        console.warn(stamp(msg));
    }
  };

  // logs error messages
  var err = function (msg) {
    if (logLevel >= levels.ERROR) {
      console.error(stamp(msg));
    }
  };

  var debug = function (msg) {
    if (logLevel >= levels.DEBUG) {
      console.log(stamp(msg));
    }
  };

  return {
    levels: levels,
    info: info,
    warn: warn,
    err: err,
    debug: debug,
    setLogLevel: setLogLevel,
    getLogs: getLogs
  };

}();

exports.log = log;
