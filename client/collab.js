
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

function setCenter(center) {
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

function setZoom(zoom) {
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

function setState(center, zoom) {
    setCenter(center);
    setZoom(zoom);
}

// socket.io listener for center change
socket.on('change_center', function(data) {
    console.log('[change_center] Received ' + JSON.stringify(data));
    setCenter(data.center);
});

// socket.io listener for zoom change
socket.on('change_zoom', function(data) {
    console.log('[change_zoom] Received ' + JSON.stringify(data));
    setZoom(data.zoom);
});

// socket.io listener for view change
socket.on('change_state', function(data) {
    console.log('[change_state] Received ' + JSON.stringify(data));
    setState(data.center, data.zoom);
});

socket.on('error', function(data) { 
    console.log("ERROR! " + JSON.stringify(data)); 
});

(function() {
    var data = { 
       center: {
            latitude: MapApp.map.getCenter().lat,
            longitude: MapApp.map.getCenter().lng
         },
        zoom: MapApp.map.getZoom()
    } 

    console.log('[init] Emitting init: ' + JSON.stringify(data)); 
    socket.emit('init', data);
})();
