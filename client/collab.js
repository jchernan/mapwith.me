
var socket = io.connect('http://localhost:8000')

function send_change_center() {
    var center = MapApp.map.getCenter();
    console.log(center);
    socket.emit('change_center', { 
        center: { latitude: center.lat,  longitude: center.lng }
    });
}

MapApp.map.on('dragend', send_change_center);
MapApp.map.on('zoomend', send_change_center);
MapApp.map.on('viewreset', send_change_center);


console.log("setting listener for init_ack");
socket.on('message', function(msg) {
    console.log("Message: " + msg); 
});

socket.on('init_ack', function(data) {
    console.log('[init_ack] Received initialize ack for collab session: ' 
                + JSON.stringify(data));
});

socket.on('change_center', function(data) {
    console.log('[change_center] Received change_center ack: '
                + JSON.stringify(data));
    MapApp.map.setView(
        new L.LatLng(data.center.latitude, data.center.longitude), 
        MapApp.map.getZoom()
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



