/*  
  collab.js  - Framework for sending/receiving map sharing information with server

  Requires:
    - socket.io
    - globals.js  (Host information)
    - backbone.js (Event handling)
 */

MapApp.log = {
  warn: console.log,
  err: console.log,
  info: function (msg) { console.log(msg); }
};

MapApp.assert = function(expression, message) {
  if (! expression) {
    MapApp.log.err(message); throw new AssertException(message); }
};

MapApp.collab = function() {
  var socket;
  var cid;    // The client id of this client
  var maxXid = 0; // The largest xid sent by this client


  /* 
    Stores the latest map movement that was sent to the server and the server
    hasn't yet acknowledged. In other words, the last map movement that has been 
    sent by the client that hasn't been forwarded back by the server.   
    
    Any map movement of the same type as this pending message can be ignored 
    until this message is acknowledged.
   */
  var pendingMsg = { opType: null, xid: null };

  /*
     Before sending a message via socket.io, assign it a XID and register its
     opType (changeCenter, changeZoom, etc). This allows us to ignore some
     messages while we're waiting for an acknowledgement.
   */
  var preSendMsg = function (opType) {
    pendingMsg.opType = opType;
    pendingMsg.xid = ++maxXid;
    return pendingMsg.xid; 
  };

  // Before processing an incoming server message, decide if it can be ignored
  //   based on any outstanding pending out-going messagse.
  var preReceiveMessage = function (data, opType) {
    if (pendingMsg.opType === opType) {
      // There's a pending outgoing message of the same type, so we can ignore
      // it. If this is our ack, though, then we can clear the pendingMsg.
      if (data.xid === pendingMsg.xid) {
        pendingMsg = { opType: null, xid: null };
      }
      return false;
    } else {
      // No pending outgoing message, so we cannot ignore
      return true;
    } 
  };

  // Send a message to the server
  var emit = function (msg, xid, args) {
    args.xid = xid;
    socket.emit(msg, args);
  };


  var setupSocketListeners = function () {
    MapApp.assert(socket, "Socket must be initialized");

    var on = function(msgType, fn) {
      socket.on(msgType, function(data) {
        if (preReceiveMessage(data, msgType)) {
          fn(data); 
        } else {
          MapApp.log.info('[' + msgType + '] Filtered message due to ' + 
            'pending state. Message was: ' + JSON.stringify(data));
        }
      });
    }; 

    // socket.io listener for center change
    on('change_center', function (data) {
      MapApp.log.info('[change_center] Received ' + JSON.stringify(data));
      /* TODO: Add validation */
        MapApp.collab.trigger('change_center', data);
    });

    // socket.io listener for zoom change
    on('change_zoom', function (data) {
      MapApp.log.info('[change_zoom] Received ' + JSON.stringify(data));
      /* TODO: Add validation */
      MapApp.collab.trigger('change_zoom', data);
    });

    // socket.io listener for view change
    on('change_state', function (data) {
      MapApp.log.info('[change_state] Received ' + JSON.stringify(data));
      /* TODO: Add validation */
      MapApp.collab.trigger('change_state', data);
    });

    // socket.io listener for send message
    on('send_message', function (data) {
      MapApp.log.info('[send_message] Received ' + JSON.stringify(data));
      /* TODO: Add validation */
      MapApp.collab.trigger('send_message', data);
    });

    // socket.io listener for init_ack message
    on('init_ack', function (data) {
      console.log('[init_ack] Received initialize ack for collab session: ' + 
          JSON.stringify(data));

      this.cid = data.cid;

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
     Initialize a sharing session

     Parameters:

       * If this is a brand-new session:
           center =  The current center location before starting to share the map.
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
  var init = function(data) {
    MapApp.log.info('[init] Emitting init: ' + JSON.stringify(data)); 


    socket = io.connect(Hosts.collaboration);
    setupSocketListeners();

    // Send initialization message to server
    var xid = preSendMsg('init');
    emit('init', xid, data);
  };
    
  /*
     Send message to change map center location
    
     Parameters:
        center = {
          - latitude: Latitude to move to
          - longitude: Longitude to move to
        }
   */
  var sendChangeCenter = function(center) {
    MapApp.log.info('[change_center] Emitting center: ' + 
      JSON.stringify(center));

    
    var xid = preSendMsg('change_center');
    emit('change_center', xid, {center: center});
  };

  /*
     Send message to change map zoom level
    
     Parameters:
        zoom = New zoom level
   */
  var sendChangeZoom = function(zoom) {
    MapApp.log.info('[change_zoom] Emitting zoom: ' + zoom);

    var xid = preSendMsg('change_zoom');
    socket.emit('change_zoom', xid, { zoom: zoom });
  };

  /*
     Send message to change both the map's zoom level and its center location
    
     Parameters:
        center = {
            - latitude: Latitude to move to
            - longitude: Longitude to move to
        }
        zoom = New zoom level
   */
  function sendChangeState(center, zoom) {
    MapApp.log.info('[change_state] Emitting center: ' + 
                     JSON.stringify(center) + ' and zoom: ' + zoom);

    var xid = preSendMsg('change_state');
    emit('change_state', xid, { 
        center: center,
        zoom: zoom
    });
  }


  /*
     Send a chat message.
    
     Parameters:
        message = Textual content of the message
   */
  function sendMessage(message) {
    MapApp.log.info('[message] Emitting message: ' +  message);

    // Don't use emit to avoid assigning an xid to this message. We don't need
    // an xid for this message since we don't care about receiving its ack
    socket.emit('send_message', { message: message });
  }

  return {
    init: init,
    sendChangeCenter: sendChangeCenter,
    sendChangeZoom: sendChangeZoom,
    sendChangeState: sendChangeState,
    sendMessage: sendMessage
  };

}();

_.extend(MapApp.collab, Backbone.Events);

/*
MapApp.collab.init();
MapApp.map.off('dragend', MapApp.collab.sendChangeCenter);
MapApp.map.off('zoomend', MapApp.collab.sendChangeZoom);
MapApp.map.off('viewreset', MapApp.collab.sendChangeState);

var socket = { on: function() {}};
*/
/* TODO (jmunizn): This should be done on init, not here */
//var socket = io.connect(Hosts.collaboration);
/*
var pendingAckState = {
    center: null,
    zoom: null
};

// Listener function for a change in map center
function sendChangeCenter() {
    var mapCenter = MapApp.map.getCenter();
    var center = { latitude: mapCenter.lat,  longitude: mapCenter.lng };
    console.log('[change_center] Emitting center: ' + 
        JSON.stringify(center));
    pendingAckState.center = center;
    socket.emit('change_center', { 
        center: center
    });
}

// Listener function for a change in map zoom level
function sendChangeZoom() {
    var zoom = MapApp.map.getZoom();
    console.log('[change_zoom] Emitting zoom: ' + zoom);
    pendingAckState.zoom = zoom;
    socket.emit('change_zoom', { zoom: zoom });
}

// Listener function for a change in map view
function sendChangeState() {
    var mapCenter = MapApp.map.getCenter();
    var center = { latitude: mapCenter.lat,  longitude: mapCenter.lng };
    var zoom = MapApp.map.getZoom();
    console.log('[change_state] Emitting center: ' + 
        JSON.stringify(center) + ' and zoom: ' + zoom);
    pendingAckState.center = center;
    pendingAckState.zoom = zoom;
    socket.emit('change_state', { 
        center: center,
        zoom: zoom
    });
}


function enableCollabListeners() {
    MapApp.map.on('dragend', sendChangeCenter);
    MapApp.map.on('zoomend', sendChangeZoom);

    MapApp.map.on('viewreset', sendChangeState);
}

function disableCollabListeners() {
    MapApp.map.off('dragend', sendChangeCenter);
    MapApp.map.off('zoomend', sendChangeZoom);
    MapApp.map.off('viewreset', sendChangeState);
}

socket.on('init_ack', function (data) {
    console.log('[init_ack] Received initialize ack for collab session: ' + 
        JSON.stringify(data));
 
    MapApp.map.setView(
        new L.LatLng(data.state.center.latitude, data.state.center.longitude),
        data.state.zoom
    );
    
    enableCollabListeners();
});

function setCenterFromServer(center) {
    if (pendingAckState.center === null) {
        console.log('[change_center] Setting new center');
        MapApp.map.panTo(
            new L.LatLng(center.latitude, center.longitude) 
        );
    } else if (pendingAckState.center.latitude === center.latitude && 
        pendingAckState.center.longitude === center.longitude) {

        console.log('[change_center] Received ack for emitted center');
        pendingAckState.center = null;
    } else {
        console.log('[change_center] Skipping due to pending ack');
    }
}

function setZoomFromServer(zoom) {
    if (pendingAckState.zoom === null) {
        console.log('[change_zoom] Setting new zoom');
        MapApp.map.setZoom(zoom);
    } else if (pendingAckState.zoom === zoom) {
        console.log('[change_zoom] Received ack for emitted zoom');
        pendingAckState.zoom = null;
    } else {
        console.log('[change_zoom] Skipping due to pending ack');
    }
}

function setStateFromServer(center, zoom) {
    setCenterFromServer(center);
    setZoomFromServer(zoom);
}

// socket.io listener for center change
socket.on('change_center', function (data) {
    console.log('[change_center] Received ' + JSON.stringify(data));
    setCenterFromServer(data.center);
});

// socket.io listener for zoom change
socket.on('change_zoom', function (data) {
    console.log('[change_zoom] Received ' + JSON.stringify(data));
    setZoomFromServer(data.zoom);
});

// socket.io listener for view change
socket.on('change_state', function (data) {
    console.log('[change_state] Received ' + JSON.stringify(data));
    setStateFromServer(data.center, data.zoom);
});

// socket.io listener for send message
socket.on('send_message', function (data) {
    console.log('[send_message] Received ' + JSON.stringify(data));
    CollabBar.postMessage(data.from, data.message);  
});


socket.on('error', function (data) { 
    console.log("ERROR! " + JSON.stringify(data)); 
});


*/



/* Initialize urlParam function. Code grabbed from 
    http://www.jquery4u.com/snippets/url-parameters-jquery/#.T9lrKStYsoY
*/
var urlParam = function (name) {
    console.log("starting urlParam " + name); 

    var results = 
        new RegExp('[\\?&]' + name + '=([^&#]*)').exec(
            window.location.href);

    console.log("regexp compiled  urlParam"); 
    return (results) ? results[1] : null;
};



/* If user has specified a session_id, then initialize a sharing session 
   immediately */
if (urlParam('session_id')) {

    // display the modal 
    var text = $(HtmlContent.shareJoin);
    $('body').append(text);

    var id = urlParam('session_id');

    var joinSession = function () { 
        /* Send a message to server indicating our desire to join a session */
        var data = { 
            session_id: id,
            username:  $("#modal-form-input").val()
        }; 
  
        MapApp.collab.on('init_ack', function (data) {
            var link = Hosts.baseURL + '?session_id=' + data.session_id;
            Share.setSharingMode(link, false);
        });

        console.log('[init] Emitting init: ' + JSON.stringify(data)); 
        MapApp.collab.init(data);

        text.modal('hide');
        
        return false;
    };
    
    $('#modal-form').submit(joinSession);
    $('#join-modal').click(joinSession);

    /* Ensure modal is always centered */
    text.modal({ 
        backdrop: true
    }).css({
        width: 'auto', 
        'margin-left': function () {
            return -($(this).width() / 2);
        }
    });
    text.modal('show');
} 
