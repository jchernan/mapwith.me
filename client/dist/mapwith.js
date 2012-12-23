var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/log.js",function(require,module,exports,__dirname,__filename,process,global){
var log = function () {

  var logLevel = 0;
  var debugLog = [];

  var levels = {
    ERROR : 0,
    WARNING : 1,
    INFO : 2,
    DEBUG : 3
  };
  
  var getLogs = function () {
    return debugLog;
  };

  var setLogLevel = function (level) {
    logLevel = (typeof level === 'undefined') ? levels.ERROR : level;

    /* Returns function to log event "fn" at the specified log level */
    var getFunction = function (fn, logLevel) {
    
      /* Returns function to obtain JSON of event "fn" */
      var getEventInfo = function (fn, args) {
        var res = functionsMap[fn].apply(null, Array.prototype.slice.call(args));
        info(JSON.stringify(res));
        return res;
      };

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
    };

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

});

var Hosts = {};

Hosts.addressFind = "http://www.mapwith.me/map_find";
Hosts.venuesFind = "http://www.mapwith.me/venue_find";
Hosts.collaboration = "http://www.mapwith.me:8000";
Hosts.baseURL = "http://www.mapwith.me";
Hosts.tiles = "http://www.mapwith.me:8888/v2/maps/{z}/{x}/{y}.png";
//Hosts.tiles = "http://{s}.tiles.mapbox.com/v3/jchernan.map-siiysyev/{z}/{x}/{y}.png";

var SanFrancisco = {
  center: {
    latitude: 37.7785,
    longitude: -122.4192
  },
  upperLeft: {
    latitude: 38.4948,
    longitude: -123.2128
  },
  lowerRight: {
    latitude: 37.1716,
    longitude: -121.5401
  }
};

var Boston = {
  center: {
    latitude: 42.3605,
    longitude: -71.0593
  },
  upperLeft: {
    latitude: 42.7020,
    longitude: -71.861
  },
  lowerRight: {
    latitude: 41.9510,
    longitude: -70.285
  }
};

var Cities = {
  "san-francisco": SanFrancisco,
  "boston": Boston
};

var DefaultCity = 'san-francisco';

var MapApp = {
  useLeaflet: false,
  log: require("/log.js").log
};

MapApp.log.setLogLevel(MapApp.log.levels.ERROR);


MapApp.content = function () {

  /*
    Content that prompts to initialize a sharing session.
    It is composed of text containing instructions to the user,
    an input area to type a name, and a button to start the
    sharing session.
  */
  var startSession =
    '<div class="row-fluid">'
    + '<div class="span12">'
    + '<div class="span6">'
    + '<p>Type your name and then click <strong>Start</strong>. '
    + 'This will create a link that you can share with your friends.</p>'
    + '</div>' // end span6
    + '<div class="span6">'
    + '<form id="popover-form">'
    + '<div class="input-append">'
    + '<input id="popover-form-input" class="input-medium" type="text" placeholder="Type your name">'
    + '<button id="popover-form-button" class="btn" type="submit">Start</button>'
    + '</div>' // end input-append
    + '</form>' // end form
    + '</div>' // end span6
    + '</div>' // end span12
    + '</div>'; // end row-fluid


  /*
    Title of the session init window.
  */
  var startSessionTitle = 'Share what you are viewing!';


  /*
    Content that shows the sharing session link.
  */
  var sessionLink =
    '<div id="session-link">'
    + '<code>LINK</code>'
    + '</div>';


  /*
    Title of the session link window.
  */
  var sessionLinkTitle = 'You are now sharing this map!';


  /*
    Content that prompts to join a sharing session.
    It is composed of text containing instructions to the user,
    an input area to type a name, and a button to start the
    sharing session.
  */
  var joinSession =
    '<div class="modal fade hide" id="initial-modal" style="width:350px">'
    + '<div class="modal-header">'
    + '<button type="button" class="close" data-dismiss="modal">x</button>'
    + '<h3> Your friend wants to map with you</h3>'
    + '</div>'
    + '<div class="modal-body" >'
    + '<div>'
    + '<p>Type your name and then click <strong>Join</strong> to start sharing.</p> '
    + '</div>'
    + '<form id="modal-form">'
    + '<center>'
    + '<input id="modal-form-input" class="input-large" type="text" placeholder="Type your name">'
    + '</center>'
    + '</form>'
    + '</div>'
    + '<div class="modal-footer">'
    + '<a href="#" class="btn" data-dismiss="modal">Close</a>'
    + '<a href="#" class="btn btn-primary" id="join-modal">Join</a>'
    + '</div>'
    + '</div>';


  return {
    startSession: startSession,
    startSessionTitle: startSessionTitle,
    sessionLink: sessionLink,
    sessionLinkTitle: sessionLinkTitle,
    joinSession: joinSession
  };

}();

/*
  collab.js  - Framework for sending/receiving map sharing
  information with server

  Requires:
    - socket.io
    - globals.js  (Host information)
    - backbone.js (Event handling)
 */

MapApp.assert = function (expression, message) {
  if (! expression) {
    MapApp.log.err(message);
    throw new AssertException(message);
  }
};

/*
  Initialize urlParam function. Code grabbed from
  http://www.jquery4u.com/snippets/url-parameters-jquery/#.T9lrKStYsoY
*/
var urlParam = function (name) {
  MapApp.log.info("Retrieving URL parameter " + name);
  var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(
    window.location.href);
  return (results) ? results[1] : null;
};

var isSameCenter = function (c1, c2) {
  return Math.abs(c1.latitude - c2.latitude) < 0.0001
    && Math.abs(c2.longitude - c2.longitude) < 0.0001;
};

MapApp.collab = function () {
  var socket;
  var cid;    // The client id of this client
  var maxXid = 0; // The largest xid sent by this client

  /*
    Stores the latest map movement that was sent to the server and
    the server hasn't yet acknowledged. In other words, the last map
    movement that has been sent by the client that hasn't been
    forwarded back by the server.

    Any map movement of the same type as this pending message can be
    ignored until this message is acknowledged.
  */
  var pendingMsg = [];
  var receivedMsg = [];

  /*
    Before sending a message via socket.io, assign it a XID and
    register its opType (changeCenter, changeZoom, etc). This allows
    us to ignore some messages while we're waiting for an
    acknowledgement.
  */
  var preSendMessage = function (opType, data) {
    // Check if the message we want to send is a message
    // that we have received (for example, a received message
    // induces a set center, which in turn fires a map event
    // for change_center; we want to stop these messages).
    // Loop through the received messages and compare their data.
    var foundReceived = false;
    checkMessages(opType, receivedMsg, function (i, msg) {
      var msgData = msg.data;
      switch (opType) {
      case 'change_zoom':
        if (msgData.zoom === data.zoom) {
          receivedMsg.splice(i, 1);
          foundReceived = true;
        }
        break;
      case 'change_center':
        if (isSameCenter(msgData.center, data.center)) {
          receivedMsg.splice(i, 1);
          foundReceived = true;
        }
        break;
      }
    });
    // If the message we want to send is a message we have
    // received, then return an invalid XID to indicate that
    // the message should not be sent.
    if (foundReceived) {
      return -1;
    }
 
    // Otherwise, get the new XID.
    var newXid = ++maxXid;

    // Check if the pending list already has a message
    // with this opType. If there is one, update its xid.
    var found = checkMessages(opType, pendingMsg, function (i, msg) {
      msg.xid = newXid;
    });
    // If the pending list had no message with this opType,
    // then add a new message with the new XID.
    if (!found) {
      pendingMsg.push({
        'opType': opType,
        'xid': newXid
      });
    }

    // Return the XID associated with the new message.
    return newXid;
  };

  /*
    Before processing an incoming server message, decide if it can
    be ignored based on any outstanding pending out-going message.
  */
  var preReceiveMessage = function (data, opType) {
    // Check if the message we are receiving is a message in
    // the list of pending acks.
    var found;
    found = checkMessages(opType, pendingMsg, function (i, msg) {
      // If this is our ack, then we can clear the pending message
      if (msg.xid === data.xid) {
        pendingMsg.splice(i, 1);
      }
    });
    // If we find a pending outgoing message of the same type
    // as the message we have received, ignore the received message.
    // Return false if the incoming message should be ignored.
    if (found) {
      return false;
    }
    
    // Check if the list of received messages already has a message
    // with this opType. If there is one, update its data.
    found = checkMessages(opType, receivedMsg, function (i, msg) {
      msg.data = data;
    });
    // If the received list had no message with this opType,
    // then add a new message with the new data.
    if (!found) {
      receivedMsg.push({
        'opType': opType,
        'data': data
      });
    }

    // Return true to indicate a valid incoming message
    return true;
  };

  /*
    Loop through the list of messages looking for a message with
    the given opType. If a message is found, call function fn
    and return true.
  */
  var checkMessages = function (opType, messages, fn) {
    var found = false;
    for (var i = messages.length - 1 ; i >= 0 ; i -= 1) {
      var msg = messages[i];
      if (msg.hasOwnProperty('opType') && msg.opType === opType) {
        fn(i, msg);
        found = true;
      }
    }
    return found;
  };

  // Send a message to the server
  var emit = function (msg, xid, args) {
    args.xid = xid;
    socket.emit(msg, args);
  };


  var setupSocketListeners = function () {
    MapApp.assert(socket, "Socket must be initialized");

    var on = function (msgType, fn) {
      socket.on(msgType, function (data) {
        if (preReceiveMessage(data, msgType)) {
          fn(data);
        } else {
          MapApp.log.info('[' + msgType + '] Filtered message due to ' +
            'pending state. Message was: ' + JSON.stringify(data));
        }
      });
    };

    // socket.io listener for search sequence
    socket.on('search', function (data) {
      MapApp.log.info('[search] Received ' + JSON.stringify(data));
      /* TODO: Add validation */
      MapApp.collab.trigger('search', data);
    });
    
    // socket.io listener for center change
    on('change_center', function (data) {
      MapApp.log.receivedCenter(data.center);
      /* TODO: Add validation */
      MapApp.collab.trigger('change_center', data);
    });

    // socket.io listener for zoom change
    on('change_zoom', function (data) {
      MapApp.log.receivedZoom(data.zoom);
      /* TODO: Add validation */
      MapApp.collab.trigger('change_zoom', data);
    });

    // socket.io listener for view change
    on('change_state', function (data) {
      MapApp.log.receivedState(data.center, data.zoom);
      /* TODO: Add validation */
      MapApp.collab.trigger('change_state', data);
    });

    // socket.io listener for send message
    on('send_message', function (data) {
      MapApp.log.info('[send_message] Received ' + JSON.stringify(data));
      /* TODO: Add validation */
      MapApp.collab.trigger('send_message', data);
    });

    // socket.io listener for add_user message
    on('add_user', function (data) {
      MapApp.log.info('[add_user] Received ' + JSON.stringify(data));
      /* TODO: Add validation */
      MapApp.collab.trigger('add_user', data);
    });


    // socket.io listener for init_ack message
    on('init_ack', function (data) {
      MapApp.log.info('[init_ack] Received initialize ack '
        + 'for collab session: '
        + JSON.stringify(data));

      cid = data.cid;

      MapApp.collab.trigger('init_ack', data);
      MapApp.collab.trigger('change_state', {
        center: {
          latitude: data.state.center.latitude,
          longitude: data.state.center.longitude
        },
        zoom : data.state.zoom
      });
    });

    // socket.io listener for error message
    on('error', function (data) {
      MapApp.log.err(JSON.stringify(data));
    });

  };

  /*
     Send message to perform an address search

     Parameters:
        address - search term
   */
  var sendSearch = function (address) {
    MapApp.log.info('[search] Emitting address: '
      + address);

    var xid = preSendMessage('search');
    emit('search', xid, { address: address });
  };

  /*
     Initialize a sharing session

     Parameters:

       * If this is a brand-new session:
           center =  The current center location before starting
           to share the map.
           {
             - latitude:  Current latitude
             - longitude: Current longitude
           }
           zoom = The current zoom level before starting to share the map.
           username = Username selected by this user.

       * If we want to join an existing session:
           session_id = The id of the session we wish to join.
           username = Username selected by this user.
  */
  var init = function (data) {
    MapApp.log.info('[init] Emitting init: ' + JSON.stringify(data));

    // Send initialization message to server
    var xid = preSendMessage('init');
    emit('init', xid, data);
  };

  var startSession = function () {
    MapApp.log.info('[start-session] User is starting share session');

    // Send a message to server indicating our desire to join a session
    var data = {
      center: MapApp.map.getCenter(),
      zoom: MapApp.map.getZoom(),
      username: $('#popover-form-input').val()
    };

    init(data);

    /* TODO(jmunizn) Add loading animation */

    return false;
  };

  var joinSession = function () {
    MapApp.log.info('[join-session] User is joining share session');

    // Send a message to server indicating our desire to join a session
    var data = {
      session_id: urlParam('session_id'),
      username: $("#modal-form-input").val()
    };

    init(data);

    return false;
  };

  /*
     Send message to change map center location

     Parameters:
        center = {
          - latitude: Latitude to move to
          - longitude: Longitude to move to
        }
   */
  var sendChangeCenter = function (center) {
    var data = { center: center };
    var xid = preSendMessage('change_center', data);
    if (xid > 0) {
      emit('change_center', xid, data);
      MapApp.log.sentCenter(center);
    }
  };

  /*
     Send message to change map zoom level

     Parameters:
        zoom = New zoom level
   */
  var sendChangeZoom = function (zoom) {
    var data = { zoom: zoom };
    var xid = preSendMessage('change_zoom', data);
    if (xid > 0) {
      emit('change_zoom', xid, data);
      MapApp.log.sentZoom(zoom);
    }
  };

  /*
     Send message to change both the map's zoom level and its
     center location

     Parameters:
        center = {
            - latitude: Latitude to move to
            - longitude: Longitude to move to
        }
        zoom = New zoom level
   */
  function sendChangeState(center, zoom) {
    var xid = preSendMessage('change_state');
    emit('change_state', xid, {
        center: center,
        zoom: zoom
      }
    );
    MapApp.log.sentState(center, zoom);
  }


  /*
     Send a chat message.

     Parameters:
        message = Textual content of the message
   */
  function sendMessage(message) {
    MapApp.log.info('[message] Emitting message: ' +  message);

    // Don't use emit to avoid assigning an xid to this message.
    // We don't need an xid for this message since we don't care
    // about receiving its ack
    socket.emit('send_message', { message: message });
  }
  
  socket = io.connect(Hosts.collaboration);
  setupSocketListeners();

  return {
    startSession: startSession,
    joinSession: joinSession,
    sendSearch: sendSearch,
    sendChangeCenter: sendChangeCenter,
    sendChangeZoom: sendChangeZoom,
    sendChangeState: sendChangeState,
    sendMessage: sendMessage
  };

}();

_.extend(MapApp.collab, Backbone.Events);


MapApp.chatWindow = function () {

  var sharingIconClass = "icon-eye-open";
  var editingIconClass = "icon-hand-up";

  var postMessage = function (sender, msg) {
    $('#chat-panel-rows .message:last').after(
        '<div class="message"><span class="sender">' +
            sender + '</span>'  + msg + '</div>'
    );
    // chat should be scrolled to the bottom
    // to ensure last messages are visible.
    // http://stackoverflow.com/questions/13362/
    $('#chat-panel-rows').each(function () {
        var scrollHeight = Math.max(this.scrollHeight, this.clientHeight);
        this.scrollTop = scrollHeight - this.clientHeight;
      }
    );
  };

  var addUser = function (username) {
    var icon_id = "icon_" + username;
    var user_list_elem_id = "user_list_elem_" + username;

    $("#user_list li:last").after(
            "<li id='" + user_list_elem_id  + "'>" +
            "<i id='" + icon_id + "' class='" + sharingIconClass +
            "'></i>" + username + "</li>");

    stopEditing(username);

    var num_friends = $("#user_list li").length - 2;
    var friend_name = num_friends > 1 ? " friends" : " friend";
    if (num_friends > 0) {
      $("#user_list_title").text("Sharing with " +
          num_friends + friend_name + ": ");
    } else {
      $("#user_list_title").text("No friends have joined");
    }

  };

  var startEditing = function (username) {
    var icon_id = "icon_" + username;
    var user_list_elem_id = "user_list_elem_" + username;

    $("#" + icon_id).attr("class", editingIconClass);
  };

  var stopEditing = function (username) {
    var icon_id = "icon_" + username;
    $("#" + icon_id).attr("class", sharingIconClass);
  };

  /*
      Initialize right menu.

      buttonListener sets up a callback for the chat button
      Parameters:
        buttonListener - The action to be executed when the user types a new
                         message.
        usernames - The usernames other than "me" that are already part of the
                    conversation (Optional).
   */
  var init = function (buttonListener, usernames) {
    var ENTER_KEY = 13;
    var messageAction = function () {
      var message_to_send = $.trim($("#chat_text").val());
      if (message_to_send !== "") {
        postMessage("Me", message_to_send);
        if (buttonListener)  {
          buttonListener(message_to_send);
        }
      }
      $("#chat_text").val("");
      return false;
    };

    $("#chat_button").click(messageAction);
    // By default, hitting 'Enter' on a textarea will create a new line.
    // We change the behavior to submit the message upon hitting 'Enter'.
    // http://stackoverflow.com/questions/4418819/
    $("#chat_text").keydown(function (e) {
      if (e.keyCode === ENTER_KEY) {
        messageAction();
        return false;
      }
    });

    addUser("Me");
    if (typeof(usernames) !== "undefined") {
      for (var i = 0; i < usernames.length; i++) {
        addUser(usernames[i]);
      }
    }

    $("#right-bar").css("display", "");

    // Listener to add message from server to chat area
    MapApp.collab.on("send_message",  function (data) {
      postMessage(data.from, data.message);
    });

    MapApp.collab.on("add_user",  function (data) {
      addUser(data.username);
    });

  };

  MapApp.collab.on('init_ack', function (data) {
    init(
      function (message) {
        MapApp.collab.sendMessage(message);
      },
      data.state.usernames
    );
  });

  // Slide chat window to minimize it
  // http://www.learningjquery.com/2009/02/slide-elements-in-different-directions
  var rightBarInnerElems = ['#chat-header', '#chat-window'];
  $(document).ready(function () {
    $('.right-bar-minimize').click(function () {
      for (var i = 0 ; i < 2 ; i++) {
        var element = $(rightBarInnerElems[i]);
        element.animate({
          marginLeft: parseInt(
            element.css('marginLeft'), 10) === 0 ?
            element.outerWidth() - 20 :
            0
        });
      }
    });
  });

}();


MapApp.map = function () {

  var mapAreas = Cities;
  var defaultArea = DefaultCity;

  // zoom values for the different map behaviors
  var mapZooms = {
    min: 11,
    max: 18,
    defaultZoom: 13,
    foundZoom: 15
  };

  // create the map layers
  var layerGroup = new L.LayerGroup();

  /*
    Map Methods
  */
  var map;

  var leafletFunctions = {
    /*
    * Initializes the map
    */
    initialize: function () {

      $('#map').addClass('map-leaflet');

      // create the map
      var center = mapAreas[defaultArea].center;
      map = new L.Map("map", {
        center: new L.LatLng(
          center.latitude,
          center.longitude
        ),
        zoom: mapZooms.defaultZoom,
        inertia: false
      });

      var tileLayer = new L.TileLayer(
        Hosts.tiles, {
          maxZoom: mapZooms.max,
          minZoom: mapZooms.min
        }
      );
      map.addLayer(layerGroup);
      map.addLayer(tileLayer);

      // add map attributions
      map.attributionControl.setPrefix(
        'Powered by <a href="http://leaflet.cloudmade.com">Leaflet</a>, ' +
        '<a href="http://foursquare.com">Foursquare</a>, ' +
        'and <a href="http://www.google.com">Google</a>'
      );
      map.attributionControl.addAttribution(
        'Map Data &copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a>'
      );

      // add listener function to redraw geopoints
      // and venues on zoom change
      map.on('zoomend', function () {
        MapApp.map.clearMarkers();
        renderGeopoints(storedGeopoints);
        renderVenues(storedVenues);
      });
    },
    /*
    * Sets the map's center coordinate
    */
    setCenter: function (center) {
      map.panTo(
        new L.LatLng(
          center.latitude,
          center.longitude
        ),
        true
      );
    },
    /*
    * Sets the map's zoom level
    */
    setZoom: function (zoom) {
      map.setZoom(zoom, true);
    },
    /*
    * Sets the map's center coordinate and zoom level
    */
    setView: function (center, zoom, silent) {
      map.setView(
        new L.LatLng(center.latitude, center.longitude),
        zoom,
        false,
        silent
      );
    },
    /*
    * Gets the map's center coordinate
    */
    getCenter: function () {
      var center = map.getCenter();
      return {
        latitude: center.lat,
        longitude: center.lng
      };
    },
    /*
    * Gets the map's zoom level
    */
    getZoom: function () {
      return map.getZoom();
    },
    /*
    * Gets the map's corner coordinate
    */
    getCorner: function () {
      var corner = map.getBounds().getNorthWest();
      return {
        latitude: corner.lat,
        longitude: corner.lng
      };
    },
    /*
    * Checks if the given point is inside any of the map areas
    */
    inBounds: function (point) {
      for (var area in mapAreas) {
        if (mapAreas.hasOwnProperty(area)) {
          var mapArea = mapAreas[area];
          if (point.latitude >= mapArea.lowerRight.latitude &&
            point.latitude <= mapArea.upperLeft.latitude &&
            point.longitude >= mapArea.upperLeft.longitude &&
            point.longitude <= mapArea.lowerRight.longitude) {

            return true;
          }
        }
      }
      return false;
    },
    /*
    * Adds a marker on the map at the given point
    */
    addMarker: function (point, markerImage, venueInfo) {
      var markerLoc = new L.LatLng(point.latitude, point.longitude);
      var url = 'images/markers/color-pin.png';
      var icon = markerImage;
      var marker = new L.Marker(
        markerLoc, {
          icon: icon
        }
      );

      if (typeof(venueInfo) !== "undefined") {
        var iconImg = null;
        if (venueInfo.icon) {
          iconImg = venueInfo.icon.prefix + "32.png";
        }

        marker.bindPopup(
          popupHtml(
            iconImg,
            venueInfo.name,
            venueInfo.stars,
            venueInfo.address)).openPopup();
      }

      layerGroup.addLayer(marker);
      return markerLoc;
    },
    /*
    * Clears all the markers from the map
    */
    clearMarkers: function () {
      layerGroup.clearLayers();
    },
    /*
    * Represents the image for a geopoint marker
    */
    geopointImage: L.icon({
      iconUrl: 'images/markers/pink-pin.png',
      shadowUrl: null,
      iconSize: new L.Point(16, 28),
      iconAnchor: new L.Point(8, 28),
      popupAnchor: new L.Point(0, - 28)
    }),
    /*
    * Represents the image for a venue marker
    */
    venueImage: L.icon({
      iconUrl: 'images/markers/blue-pin.png',
      shadowUrl: null,
      iconSize: new L.Point(16, 28),
      iconAnchor: new L.Point(8, 28),
      popupAnchor: new L.Point(0, - 28)
    }),
    /*
    * Enables the collaboration listeners
    */
    enableCollabListeners: function () {
      map.on('dragend', sendChangeCenter);
      map.on('collabend', sendChangeState);
    }
  };

  var googleFunctions = {
    initialize: function () {

      $('#map').addClass('map-google');

      // create the map
      var center = mapAreas[defaultArea].center;
      var mapOptions = {
        center: new google.maps.LatLng(
          center.latitude,
          center.longitude
        ),
        zoom: mapZooms.defaultZoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.HYBRID,
            google.maps.MapTypeId.SATELLITE
          ]
        },
        rotateControl: false,
        streetViewControl: false,
        tilt: 0
      };

      map = new google.maps.Map(
        document.getElementById('map'),
        mapOptions
      );

      // add listener function to redraw geopoints
      // and venues on zoom change
      google.maps.event.addListener(map, 'zoom_changed', function () {
        MapApp.map.clearMarkers();
        renderGeopoints(storedGeopoints);
        renderVenues(storedVenues);
      });
    },
    /*
    * Sets the map's center coordinate
    */
    setCenter: function (center) {
      var currentCenter = MapApp.map.getCenter();
      if (isSameCenter(currentCenter, center)) {
        return;
      }
      map.panTo(
        new google.maps.LatLng(
          center.latitude,
          center.longitude)
      );
    },
    /*
    * Sets the map's zoom level
    */
    setZoom: function (zoom) {
      var currentZoom = MapApp.map.getZoom();
      if (currentZoom === zoom) {
        return;
      }
      map.setZoom(zoom);
    },
    /*
    * Sets the map's center coordinate and zoom level
    */
    setView: function (center, zoom, silent) {
      MapApp.map.setCenter(center);
      MapApp.map.setZoom(zoom);
    },
    /*
    * Gets the map's center coordinate
    */
    getCenter: function () {
      var center = map.getCenter();
      return {
        latitude: center.lat(),
        longitude: center.lng()
      };
    },
    /*
    * Gets the map's zoom level
    */
    getZoom: function () {
      return map.getZoom();
    },
    /*
    * Gets the map's corner coordinate
    */
    getCorner: function () {
      var corner = map.getBounds().getNorthEast();
      return {
        latitude: corner.lat(),
        longitude: corner.lng()
      };
    },
    /*
    * Checks if the given point is inside any of the map areas
    */
    inBounds: function (point) {
      return true;
    },
    /*
    * Adds a pin on the map at the given point
    */
    addMarker: function (point, markerImage, venueInfo) {
      var markerLoc = new google.maps.LatLng(
        point.latitude,
        point.longitude
      );

      var marker = new google.maps.Marker({
        position: markerLoc,
        icon: markerImage,
        map: map
      });

      if (typeof(venueInfo) !== 'undefined') {
        var icon = null;
        if (venueInfo.icon) {
          icon = venueInfo.icon.prefix + '32.png';
        }

        google.maps.event.addListener(marker, 'click', function () {
          var infoWindow = MapApp.map.markerInfoWindow;
          infoWindow.setContent(
            popupHtml(
              icon,
              venueInfo.name,
              venueInfo.stars,
              venueInfo.address
            )
          );
          infoWindow.open(map, marker);
        });
      }

      shownMarkers.push(marker);
      return markerLoc;
    },
    /*
    * Clears all the markers from the map
    */
    clearMarkers: function () {
      if (shownMarkers) {
        for (var i in shownMarkers) {
          shownMarkers[i].setMap(null);
        }
        shownMarkers.length = 0;
      }
    },
    /*
    * Represents the information window that is displayed
    * when clicking a geopoint marker.
    */
    markerInfoWindow: new google.maps.InfoWindow(),
    /*
    * Represents the image for a geopoint marker
    */
    geopointImage: new google.maps.MarkerImage(
      'images/markers/pink-pin.png',
      new google.maps.Size(16, 28),
      new google.maps.Point(0, 0),
      new google.maps.Point(8, 28)
    ),
    /*
    * Represents the image for a venue marker
    */
    venueImage: new google.maps.MarkerImage(
      'images/markers/blue-pin.png',
      new google.maps.Size(16, 28),
      new google.maps.Point(0, 0),
      new google.maps.Point(8, 28)
    ),
    /*
    * Enables the collaboration listeners
    */
    enableCollabListeners: function () {
      google.maps.event.addListener(map, 'zoom_changed', sendChangeZoom);
      google.maps.event.addListener(map, 'center_changed', sendChangeCenter);
    }
  };

  var setViewOnArea = function (area) {
    var center = mapAreas[area].center;
    MapApp.map.setView(center, mapZooms.defaultZoom);
  };

  var popupHtml = function (iconUrl, name, stars, address) {
    var starsHtml = function (stars) {
      var html = "";
      for (var i = 0; i < 5; i++) {
        if (i < stars) {
          html += "<span class='red-star'></span>";
        } else {
          html += "<span class='gray-star'></span>";
        }
      }
      return html;
    };

    var html =  '<div style="overflow:auto;width:100%" >';
    html +=   '<div class="venue-icon"> ';
    if (iconUrl) {
      html +=     '<img class="venue-icon" src="' + iconUrl  + '" />';
    }
    html +=   '</div>';
    html +=   '<div class="venue-main"> ';
    html +=     '<div style="font-weight:bold">' + name + '</div>';
    html +=     '<div style="height:16px">' + starsHtml(stars) + '</div>';
    html +=   '</div>';
    html += '</div>';
    if (address) {
      html += '<div class="venue-address">' + address + '</div>';
    }

    return html;
  };

  /*
    Rendering methods. The map stores the points that it is
    currently rendering. A point can be either a geopoint
    or a venue.

    A geopoint is a geographical coordinate in the map retrieved from
    a geolocator search using an input address.

    A venue is a geographical coordinate that represents a place of
    interest near a geopoint.
  */

  var shownMarkers = [];
  var storedGeopoints = [];
  var storedVenues = [];

  var clear = function () {
    storedGeopoints = [];
    storedVenues = [];
    MapApp.map.clearMarkers();
  };

  var drawGeopoints = function (points) {
    storedGeopoints = storedGeopoints.concat(points);
    renderGeopoints(points);
  };

  var drawVenues = function (points) {
    storedVenues = storedVenues.concat(points);
    renderVenues(points);
  };

  var renderGeopoints = function (geopoints) {
    if (geopoints.length === 0) {
      return;
    }
    MapApp.log.info('Call to renderGeopoints. Received '
      + geopoints.length + ' points.');

    for (var i = 0 ; i < geopoints.length ; i++) {
      MapApp.map.addMarker(geopoints[i], MapApp.map.geopointImage);
    }
  };

  var renderVenues = function (venues) {
    if (venues.length === 0) {
      return;
    }
    MapApp.log.info('Call to renderVenues. Received '
      + venues.length + ' points.');

    venues = venues.slice(0);
    var zoomLevel = MapApp.map.getZoom();
    var center = MapApp.map.getCenter();
    var corner = MapApp.map.getCorner();
    var radiusOfInterest = distance(center, corner);
    var threshold = radiusOfInterest * 0.002;
    MapApp.log.info('zoom level: ' + zoomLevel
      + ', thresh radius: ' + threshold);

    var someoneIsSpliced = true;
    var splicedCount = 0;

    while (someoneIsSpliced) {
      someoneIsSpliced = false;
      for (var i = 0; i < venues.length; i++) {
        var venue = venues[i];
        var nearestVenueIdx = nearestNeighbor(venue, venues);
        var nearestVenue = venues[nearestVenueIdx];
        var venueIdxToSplice;

        // Decide which venue to splice between nearestVenue and venue
        // based on their popularity
        if (nearestVenue.popularity < venue.popularity) {
          venueIdxToSplice = nearestVenueIdx;
        } else {
          venueIdxToSplice = i;
        }

        if (distance(nearestVenue, venue) < threshold) {
          venues.splice(venueIdxToSplice, 1);
          someoneIsSpliced = true;
          splicedCount += 1;
        }
      }
    }

    MapApp.log.info('Spliced ' + splicedCount + ' venues');
    MapApp.log.info('Rendering ' + venues.length + ' venues');
    for (var j = 0; j < venues.length; j++) {
      var point = venues[j];
      if (MapApp.map.inBounds(point)) {
        MapApp.map.addMarker(point, MapApp.map.venueImage, point);
      }
    }
  };

  var nearestNeighbor = function (point, points) {
    var distances = $.map(points, function (point_i, i) {
      if (point_i === point)
        return Number.MAX_VALUE; //Avoid comparing the point against itself
      else
        return distance(point_i, point);
    });

    var min_distance = Number.MAX_VALUE;
    var min_point_idx = 0;

    for (var i = 0; i < points.length; i++) {
      if (distances[i] < min_distance) {
        min_point_idx = i;
        min_distance = distances[i];
      }
    }

    return min_point_idx;
  };

  var distance = function (p1, p2) {
    return Math.pow(p1.latitude - p2.latitude, 2)
      + Math.pow(p1.longitude - p2.longitude, 2);
  };

  /*
    Collaboration Methods
  */

  // Listener function for a change in map center
  var sendChangeCenter = function () {
    var center = MapApp.map.getCenter();
    MapApp.collab.sendChangeCenter(center);
  };

  // Listener function for a change in map zoom level
  var sendChangeZoom = function () {
    var zoom = MapApp.map.getZoom();
    MapApp.collab.sendChangeZoom(zoom);
  };

  // Listener function for a change in map view
  var sendChangeState = function () {
    var center = MapApp.map.getCenter();
    var zoom = MapApp.map.getZoom();
    MapApp.collab.sendChangeState(center, zoom);
  };

  MapApp.collab.on('change_center', function (data) {
    MapApp.map.setCenter(data.center);
  });

  MapApp.collab.on('change_zoom', function (data) {
    MapApp.map.setZoom(data.zoom);
  });

  MapApp.collab.on('change_state', function (data) {
    MapApp.map.setView(data.center, data.zoom, true);
  });

  MapApp.collab.on('init_ack', function (data) {
    MapApp.map.enableCollabListeners();
  });

  var res = {
    defaultArea: defaultArea,
    mapZooms: mapZooms,
    setViewOnArea: setViewOnArea,
    clear: clear,
    drawGeopoints: drawGeopoints,
    drawVenues: drawVenues
  };

  var fn;
  if (MapApp.useLeaflet) {
    for (fn in leafletFunctions) {
      if (leafletFunctions.hasOwnProperty(fn)) {
        res[fn] = leafletFunctions[fn];
      }
    }
  } else {
    for (fn in googleFunctions) {
      if (googleFunctions.hasOwnProperty(fn)) {
        res[fn] = googleFunctions[fn];
      }
    }
  }

  return res;

}();

// add listener to initialize map on page load
if (MapApp.useLeaflet) {
  window.addEventListener(
    'load',
    MapApp.map.initialize
  );
} else {
  google.maps.event.addDomListener(
    window,
    'load',
    MapApp.map.initialize
  );
}



MapApp.searchField = function () {

  var cssId = '#address-input';
  var loaderIconImg = 'images/loader.gif';

  var getInput = function () {
    return $(cssId).val();
  };

  var showLoader = function () {
    $(cssId).css(
      'background-image',
      'url("' + loaderIconImg + '")'
    );
  };

  var hideLoader = function () {
    $(cssId).css('background-image', '');
  };

  return {
    showLoader: showLoader,
    hideLoader: hideLoader,
    getInput: getInput
  };

}();



MapApp.search = function () {

  // sends a request to the address server to get the coordinates
  // of the input address. then it sends a request to the venues
  // server to get the venues around the coordinate.
  var findAddress = function () {

    var inputField = MapApp.searchField.getInput();

    // check if input is undefined, empty, or all whitespaces
    if (!inputField || /^\s*$/.test(inputField)) {
      MapApp.log.warn('Undefined or empty input');
      return false;
    }

    var address = {
      "address": inputField
    };

    MapApp.collab.sendSearch(inputField);

    return false;
  };

  var currentSearch = { cid: null, xid: null };

  MapApp.collab.on('search', function (data) {

    MapApp.log.info('[search] Current search is '
      + JSON.stringify(currentSearch));

    var singleUserMode = typeof(data.from_cid) === "undefined";
    var noCurrentSearch = !currentSearch.cid && !currentSearch.xid;
    var sameAsCurrentSearch =
        (data.from_cid === currentSearch.cid
        && data.xid === currentSearch.xid);

    if (!(singleUserMode || noCurrentSearch  || sameAsCurrentSearch)) {
    //if (typeof(data.from_cid) !== 'undefined'
    //  && (data.from_cid !== currentSearch.cid
    //    || data.xid !== currentSearch.xid)) {
      return;
    }

    var opType = data.type;
    MapApp.log.info('[search] Performing search operation "'
      + data.type + '"');

    switch (opType) {

    case 'begin':
      // Set client ID and transaction ID
      currentSearch.cid = data.from_cid;
      currentSearch.xid = data.xid;
      // Show loader animation in search bar
      MapApp.searchField.showLoader();
      MapApp.map.clear();
      break;

    case 'end':
      // Hide loader animation in search bar
      MapApp.searchField.hideLoader();
      currentSearch.cid = null;
      currentSearch.xid = null;
      break;

    case 'draw_geopoints':
      if (data.points && data.points.length > 0) {
        // draw geopoints
        MapApp.map.drawGeopoints(data.points);
        // center on the first geopoint in the list
        MapApp.map.setView(data.points[0], MapApp.map.mapZooms.foundZoom);
      }
      break;

    case 'draw_venues':
      if (data.points && data.points.length > 0) {
        MapApp.map.drawVenues(data.points);
      }
      break;
    }
  });

  return {
    findAddress: findAddress
  };

}();



MapApp.shareButton = function () {

  var cssId = '#share';

  var getButton = function () {
    return $(cssId);
  };

  var setSharingMode = function () {
    // change the color and text of the button
    getButton().removeClass('btn-inverse');
    getButton().addClass('btn-success');
    getButton().html('Sharing');
  };

  MapApp.collab.on('init_ack', setSharingMode);

  return {
    getButton: getButton
  };

}();


!function ($) {

  "use strict"; // jshint ;_;


 /* SHAREPOPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var SharePopover = function (element, options) {
    this.init('sharepopover', element, options);
  };

  /* NOTE: SHAREPOPOVER EXTENDS BOOTSTRAP-POPOVER.js
     ========================================== */

  SharePopover.prototype = $.extend({}, $.fn.popover.Constructor.prototype, {

    constructor: SharePopover,
    show: function () {
      var $tip, inside, pos, actualWidth, actualHeight, placement, tp;

      if (this.hasContent() && this.enabled) {
        $tip = this.tip();
        this.setContent();

        if (this.options.animation) {
          $tip.addClass('fade');
        }

        placement = 'bottom';

        inside = /in/.test(placement);

        $tip
          .remove()
          .css({ top: 0, left: 0, display: 'block' })
          .appendTo(inside ? this.$element : document.body);

        pos = this.getPosition(inside);

        actualWidth = $tip[0].offsetWidth;
        actualHeight = $tip[0].offsetHeight;

        tp = {
          top: pos.top + pos.height + 3,
          left: pos.left + pos.width - actualWidth
        };

        $tip
          .css(tp)
          .addClass(placement)
          .addClass('in');
      }
    }

  });


 /* SHAREPOPOVER PLUGIN DEFINITION
  * ======================= */

  $.fn.sharepopover = function (option) {
    return this.each(function () {
      var $this = $(this),
          data = $this.data('sharepopover'),
          options = typeof option == 'object' && option;
      if (!data) $this.data('sharepopover', (data = new SharePopover(this, options)));
      if (typeof option == 'string') data[option]();
    });
  };

  $.fn.sharepopover.Constructor = SharePopover;

  $.fn.sharepopover.defaults = $.extend({}, $.fn.popover.defaults, {
    template: '<div class="popover"><div class="arrow" style="left:93%"></div><div class="popover-inner" style="width:500px;"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
  });

}(window.jQuery);


// VERTICALLY ALIGN FUNCTION
(function ($) {
  $.fn.vAlign = function () {
    return this.each(function (i) {
      var ah = $(this).height();
      var ph = $(this).parent().height();
      var mh = Math.ceil((ph - ah) / 2);
      $(this).css('margin-top', mh);
    });
  };
})(window.jQuery);


MapApp.sessionInitWindow = function () {

  var shareButton = MapApp.shareButton.getButton();

  var getWindowContent = function (link) {
    if (link === null) {
      return MapApp.content.startSession;
    } else {
      var content = MapApp.content.sessionLink.replace('LINK', link);
      return content;
    }
  };

  var getWindowTitle = function (link) {
    if (link === null) {
      return MapApp.content.startSessionTitle;
    } else {
      return MapApp.content.sessionLinkTitle;
    }
  };

  var showWindow = function () {
    shareButton.sharepopover('toggle');
    // check if #popover-form exists
    if ($('#popover-form').length > 0) {
      $('#popover-form').vAlign();
      $('#popover-form').submit(MapApp.collab.startSession);
      $('#popover-form-button').click(MapApp.collab.startSession);
    }
  };

  var hideWindow = function () {
    shareButton.sharepopover('hide');
  };

  var setSharingMode = function (link, showPopover) {
    // get popover from share button
    var popover = shareButton.data('sharepopover');
    if (showPopover) {
      // need to turn off animation to make a smooth
      // transition if popover is already open
      popover.options.animation = false;
    }
    // get the content and title for the popover
    popover.options.content = getWindowContent(link);
    popover.options.title = getWindowTitle(link);

    if (showPopover) {
      // call 'show' to refresh the popover content.
      // then turn animation on again.
      shareButton.sharepopover('show');
      popover.options.animation = true;
    }
  };

  shareButton.sharepopover({
    trigger: 'manual',
    html: true,
    content: getWindowContent(null),
    title: getWindowTitle(null)
  });

  window.onresize = hideWindow;
  shareButton.click(showWindow);

  MapApp.collab.on('init_ack', function (data) {
    var link = Hosts.baseURL + '?session_id=' + data.session_id;
    setSharingMode(link, true);
  });

}();


MapApp.sessionJoinWindow = function () {

  var text = $(MapApp.content.joinSession);

  var init = function () {

    // display the modal
    $('body').append(text);

    $('#modal-form').submit(MapApp.collab.joinSession);
    $('#join-modal').click(MapApp.collab.joinSession);

    // Ensure modal is always centered
    text.modal({
        backdrop: true
      }
    ).css({
        width: 'auto',
        'margin-left': function () {
          return -($(this).width() / 2);
        }
      }
    );

    text.modal('show');
  };

  MapApp.collab.on('init_ack', function (data) {
    text.modal('hide');
  });

  // If user has specified a session_id,
  // then initialize the session join window
  if (urlParam('session_id')) {
    init();
  }

}();
