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
              session_id        - id of the connection to open 
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
            
            var session_id; 
            if (data.session_id) {
                session_id = data.session_id; 
                assert.notEqual(typeof stateMap[session_id], "undefined");
            } else {
                session_id = maxId + 1; 
                maxId = session_id;
                assert.equal(typeof stateMap[session_id], "undefined");
                stateMap[session_id] = { 
                        center: data.center, 
                        zoomLevel: data.zoomLevel 
                };
            } 
            
            session_id = 1;
            socket.session_id = session_id;
            socket.join(session_id); 
              
            socket.emit('init_ack', { 
                  "session_id": session_id, 
                  "state": stateMap[session_id] 
                }); 

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
               if (! (socket.session_id  && stateMap[socket.session_id])) {
                    console.log("[ERR - change_center] Invalid state");
               }
               else {
                    console.log("[change_center] Client " + 
                                socket.session_id + " moved with args" 
                                + JSON.stringify(data)); 
 
                    stateMap[socket.session_id].center = data.center; 
                    io.sockets.in(socket.session_id).emit('change_center', data);  
              }
        }); 

});


