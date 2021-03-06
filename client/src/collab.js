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

