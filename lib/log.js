
var log = function () {

  var logLevel = 0;
  
  // logs information messages
  var info = function (msg) { 
    console.log(msg); 
  };

  // logs warning messages
  var warn = function (msg) { 
    console.warn(msg); 
  };

  // logs error messages
  var err = function (msg) { 
    console.error(msg); 
  };
  
  var setLogLevel = function (level) {
    logLevel = (typeof level === 'undefined') ? 0 : level;
    for (var fn in functionsMap) {
      if (functionsMap.hasOwnProperty(fn)) {
        if (logLevel === 0) {
          this[fn] = function () { /* empty function */ }; 
        } else if (logLevel === 1) {
          this[fn] = functionsMap[fn]; 
        }
      }
    }
  };

  var functionsMap = {
    changeCenter: function () {
      console.log('Changed center'); 
    },
    changeZoom: function () {
      console.log('Changed zoom'); 
    }
  }

  return {
    info: info,
    warn: warn,
    err: err,
    setLogLevel: setLogLevel
  };

}();

exports.log = log;
