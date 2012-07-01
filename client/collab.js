/*  
   collab.js  - Framework for sending/receiving map sharing information with server

   Requires:
    - right-bar.js 

 */

/* TODO (jmunizn): This should be done on init, not here */
var socket = io.connect(Hosts.collaboration);
var pendingAckState = {
    center: null,
    zoom: null
};

// Listener function for a change in map center
function sendChangeCenter() {
    var mapCenter = MapApp.map.getCenter();
    var center = { latitude: mapCenter.lat,  longitude: mapCenter.lng };
    console.log('[change_center] Emitting center: ' 
                + JSON.stringify(center));
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
    console.log('[change_state] Emitting center: ' 
                + JSON.stringify(center) + ' and zoom: '
                + zoom);
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

socket.on('init_ack', function(data) {
    console.log('[init_ack] Received initialize ack for collab session: ' 
                + JSON.stringify(data));
 
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
    } else if (pendingAckState.center.latitude === center.latitude
                && pendingAckState.center.longitude === center.longitude) {
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
socket.on('change_center', function(data) {
    console.log('[change_center] Received ' + JSON.stringify(data));
    setCenterFromServer(data.center);
});

// socket.io listener for zoom change
socket.on('change_zoom', function(data) {
    console.log('[change_zoom] Received ' + JSON.stringify(data));
    setZoomFromServer(data.zoom);
});

// socket.io listener for view change
socket.on('change_state', function(data) {
    console.log('[change_state] Received ' + JSON.stringify(data));
    setStateFromServer(data.center, data.zoom);
});

// socket.io listener for send message
socket.on('send_message', function(data) {
    console.log('[send_message] Received ' + JSON.stringify(data));
    CollabBar.postMessage(data.from, data.message);  
});


socket.on('error', function(data) { 
    console.log("ERROR! " + JSON.stringify(data)); 
});


/* Initialize urlParam function. Code grabbed from 
    http://www.jquery4u.com/snippets/url-parameters-jquery/#.T9lrKStYsoY
*/
var urlParam = function(name) {
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

    var text = $(HtmlContent.shareJoin);

   $('body').append(text);

   var id = urlParam('session_id');

   var joinSession = function() { 
        /* Send a message to server indicating our desire to join a session */
        var data = { 
            session_id: id,
            username:  $("#modal-form-input").val()
        } 

        console.log('[init] Emitting init: ' + JSON.stringify(data)); 
        socket.emit('init', data);

        var link = Hosts.baseURL + '?session_id=' + id;
        Share.setSharingMode(link, false);

        text.modal('hide');
        
        return false;
   }
    
   $('#modal-form').submit(joinSession);
   $('#join-modal').click(joinSession);

   text.modal('show');
} 
