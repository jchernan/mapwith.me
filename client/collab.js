
var socket = io.connect(Hosts.collaboration);

// Listener function for a change in map center
function send_change_center() {
    var center = MapApp.map.getCenter();
    console.log('[change_center] Emiting center: ' 
                + JSON.stringify(center));
    socket.emit('change_center', { 
        center: { latitude: center.lat,  longitude: center.lng }
    });
}

// Listener function for a change in map zoom level
function send_change_zoom() {
    var zoom = MapApp.map.getZoom();
    console.log('[change_zoom] Emiting zoom: ' + zoom);
    socket.emit('change_zoom', { zoom: zoom });
}

// Listener function for a change in map view
function send_change_state() {
    var center = MapApp.map.getCenter();
    var zoom = MapApp.map.getZoom();
    console.log('[change_state] Emiting center: ' 
                + JSON.stringify(center) + ' and zoom: '
                + zoom);
    socket.emit('change_state', { 
        center: { latitude: center.lat,  longitude: center.lng },
        zoom: zoom
    });
}

MapApp.map.on('dragend', send_change_center);
MapApp.map.on('zoomend', send_change_zoom);
MapApp.map.on('viewreset', send_change_state);


console.log("setting listener for init_ack");
socket.on('message', function(msg) {
    console.log("Message: " + msg); 
});

socket.on('init_ack', function(data) {
    console.log('[init_ack] Received initialize ack for collab session: ' 
                + JSON.stringify(data));
});

// socket.io listener for center change
socket.on('change_center', function(data) {
    console.log('[change_center] Received ack: '
                + JSON.stringify(data));
    MapApp.map.panTo(
        new L.LatLng(data.center.latitude, data.center.longitude) 
    );
});

// socket.io listener for zoom change
socket.on('change_zoom', function(data) {
    console.log('[change_zoom] Received ack: '
                + JSON.stringify(data));
    MapApp.map.setZoom(data.zoom);
});

// socket.io listener for view change
socket.on('change_state', function(data) {
    console.log('[change_state] Received ack: '
                + JSON.stringify(data));
    MapApp.map.setView(
        new L.LatLng(data.center.latitude, data.center.longitude), 
        data.zoom
    );
});

socket.on('error', function(data) { 
    console.log("ERROR! " + JSON.stringify(data)); 
});

// Connecting for the first time
socket.emit('init', { 
  center: { latitude: 18,  longitude: 19 },
  zoomLevel: 20      
});



