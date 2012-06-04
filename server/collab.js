var http = require("http");
var assert = require("assert");
var app = http.createServer(function (req, res) {
    res.end("Screw you");
 }); 

var io = require("socket.io").listen(app, {origins: '*:*'} ); 


var stateMap  = {}; 
var maxId = 0;

app.listen(8000); 

/* TODO: Fix indentation. Add LintJS? */

io.sockets.on('connection', function(socket) {

    console.log("Someone connected"); 

        /*  
            Every client must first call init to set up connection with
            the server before any other function can be called. 

            Call to init requires arguments:
              id        - id of the connection to open 
              center    - location of the center of the map currently being 
                          displayed by the client. Has two parts:
                            * latitude
                            * longitude
              zoomLevel - zoom level of the map currently being displayed by the
                        client 
              points (?) TBD
         */
        socket.on('init', function(data) {
            console.log("[init] Initializing collab session with args" 
                        + JSON.stringify(data)); 
    
            /* TODO: What if id is not received ? */
            var id; 
            if (data.id) {
                id = data.id; 
                assert.notEqual(typeof stateMap[id], "undefined");
            } else {
                /* Initialize brand new id */
                id = maxId + 1; 
                maxId = id;
                assert.equal(typeof stateMap[id], "undefined");
                stateMap[id] = { 
                        center: data.center, 
                        zoomLevel: data.zoomLevel 
                };
            } 

            socket.id = id;
            socket.join(id); 
                
            socket.emit('init_ack', { id: "fuckyoufuckyoufuckyoufuckyou" });
            //socket.emit('init_ack', { "id": id, "state": stateMap[id] }); 
            console.log("emit init_ack");
      });


        /*  
            Signal from client that the user has moved inside the map to a new
            center

            Call to change_center requires arguments:
              center    - location of the new center currently being 
                          displayed by the client. Has two parts:
                            * latitude
                            * longitude

         */

     socket.on('change_center', function(data) {
               if (! (socket.id  && stateMap[socket.id])) {
                    console.log("[ERR - change_center] Invalid state");
               }
               else {
                    stateMap[socket.id].center = data.center; 
                    io.sockets.in(socket.id).emit('change_center', data);  
              }
        }); 

});


