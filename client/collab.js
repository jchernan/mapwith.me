
var socket = io.connect('http://192.168.1.65:8000')

console.log("setting listener for init_ack");
socket.on('init_ack', function(data) {
    console.log('[init_ack] Received initialize ack for collab session: ' 
                + JSON.stringify(data));
});

socket.on('change_center', function(data) {
    console.log('[change_center] Received change_center ack: '
                + JSON.stringify(data));
});

socket.on('error', function(data) { 
    console.log("ERROR! " + JSON.stringify(data)); 
});


// Connecting for the first time
socket.emit('init', { 
  center: { latitude: 18,  longitude: 19 },
  zoomLevel: 20      
});

// Second connection
socket.emit('change_center', { 
  center: { latitude: 08,  longitude: 09 }
});


