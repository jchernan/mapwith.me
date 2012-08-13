var http = require("http");
var assert = require("assert");
var search = require("./search.js");
var app = http.createServer(function (req, res) {
    res.end("Maps v0.1");
 }); 

var io = require("socket.io").listen(app, {origins: '*:*'} ); 


var state_map  = {}; 
var max_id = 0;

app.listen(8000); 

/* TODO: Fix indentation. Add LintJS? */

io.sockets.on('connection', function(socket) {

    console.log("Someone connected"); 
    /*
       Every message sent by this server include information 
        associated with the sender see annotate_data.

        Additionally, when a client messages this server with data,
        and this server then forwards the message to other clients 
        in the same session, the server includes every field added
        by the client (such as xids, etc). 
    */


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
            console.log("[init] Initializing collab session with args" + 
                        JSON.stringify(data)); 
    
            /* TODO: What if id is not received ? */
            
            var session_id; 
            var cid; 
            if (data.session_id) {
                session_id = data.session_id; 
                assert.notEqual(typeof state_map[session_id], "undefined");

                cid = ++(state_map[session_id].max_cid);
            } else {
                /* Initialize a brand new session */
                session_id = max_id + 1; 
                cid = 1;
                console.log("New session with id " + session_id); 
                max_id = session_id;
                assert.equal(typeof state_map[session_id], "undefined");
                state_map[session_id] = { 
                        center: data.center, 
                        zoom: data.zoom,
                        usernames: [],
                        max_cid: cid
                };
            } 
            
            socket.session_id = session_id;
            socket.cid = cid;
            socket.username = data.username;
            socket.join(session_id); 
              
            socket.emit('init_ack', { 
                  "session_id": session_id, 
                  "state": state_map[session_id],
                  "cid": cid 
                }); 


            /* We only add this user to the session map after we've sent
               its inick_ack, which we consider the point at which the 
               user has actually joined. 
            */

            state_map[session_id].usernames.push(data.username);

            /* Inform everyone else that a new user has joined */
            socket.broadcast.to(socket.session_id).emit(
                'add_user', {username: socket.username});  
 
            console.log("emit init_ack");

      });



    
     /*  Change the state saved for the specified id.   
         Parameters:
           - id       - The session id 
           - new_data -  Object whose fields will be set on the state's
                         own object
      
      */
     var change_state_map = function(session_id, new_data) {
        console.log("[change_state_map] Client " + session_id +
                    " moved with data " + JSON.stringify(new_data)); 

        for (var field in new_data) {
           if (new_data.hasOwnProperty(field)) {
                state_map[session_id][field] = new_data[field];
           } 
        }

     };

    /* 
        Annotate received message with sender information 
        Parameters:
          - data - Incoming message from some client. 
        Side effects:
          Adds two fields to data:
            - from_cid (cid from which message was received)
            - from     (sender's username)

     */
    var annotate_data = function(data) {
        data.from_cid = socket.cid;
        data.from = socket.username;
    };



    /* 
        Search for geolocation and venues near the specified address. 

        Calling this function requires a data object which needs the following
        fields:

        address - Search term. Can be an address, institution name, city, etc. 


        Note: This is the only function (aside from init) that can be called 
              before initiating a session (using init). When called without
              an initialized session, this function simply performs a search
              and returns the results to the caller. When called within an 
              initialized session, this function works in 'collab mode' and
              forwards the results to the other members of the session so they
              can render the search results, too.
        
        Response: 
            A sequence of messages of the following form:
            - begin_search, to mark the start of the result set.
            - After begin_search, a sequence of messages, each of which can be:
              - draw_geopoints (an array of geopoints that match the query)
              - draw_venues (an array of some venues that are close by)
            - end_search, to mark the end of the result set.
     */
    socket.on('search', function(data) {
        var send;
        if (socket.session_id) {
            send = function(msg, data)  { 
                io.sockets.in(socket.session_id).emit(msg, data);
            };
        } else {
            send = function(msg, data) {
               socket.emit(msg, data); 
            }; 
        }

        annotate_data(data);

        data.type = 'begin'
        send('search', data); 

        search.google_search(data.address, function(points) {
            /* Send search draw_geopoints message */
            data.type = 'draw_geopoints'
            data.points = points;
            send('search', data);

            var venue_partial = function(id, venues) {
                /* Send search draw_venues message */
                data.type = 'draw_venues'
                data.points = venues;
                send('search', data);
            };

            var venue_final = function(venues) {
                /* Send search end */
                data.type = 'end'
                data.points = undefined;
                send('search', data);
            };

            search.venue_search(
                points, 
                [500, 1000, 2000, 3000], 
                venue_partial,
                venue_final);

        });

    }); 

    /*  
        Signal from client that the user has moved inside the map to:
        -  a new center (change_center), 
        -  a new zoom level (change_zoom), or 
        -  both (change_state). 

        Call to these functions requires a data object which needs the following
        fields depending on the function. 

        center    (change_center)  - location of the new center currently being 
                                     displayed by the client. Has two parts:
                                    * latitude
                                    * longitude

        zoom      (change_zoom)    - new zoom level by the client. 
        
        Note that change_state requires both attributes. 
    */
    socket.on('change_center', function(data) {
        if (! (socket.session_id  && state_map[socket.session_id])) {
            console.log("[ERR - change_center] Invalid state");
        }
        else {
            change_state_map(socket.session_id, data); 
            annotate_data(data);
            io.sockets.in(socket.session_id).emit('change_center', data);  
        }
    });

    socket.on('change_zoom', function(data) {
        if (! (socket.session_id  && state_map[socket.session_id])) {
            console.log("[ERR - change_zoom] Invalid state");
        }
        else {
            change_state_map(socket.session_id, data); 
            annotate_data(data);
            io.sockets.in(socket.session_id).emit('change_zoom', data);  
        }
    });

    socket.on('change_state', function(data) {
        if (! (socket.session_id  && state_map[socket.session_id])) {
            console.log("[ERR - change_state] Invalid state");
        }
        else {
            change_state_map(socket.session_id, data); 
            annotate_data(data);
            io.sockets.in(socket.session_id).emit('change_state', data);  
        }
    });
 
    /*  
        Signal from client that the user has sent a message. 

        Call to this function requires a data object with the following field:
        
        message  - message sent by the user

     */

     socket.on('send_message', function(data) {
        if (! (socket.session_id  && state_map[socket.session_id])) {
            console.log("[ERR - send_message Invalid state");
        }
        else {
            annotate_data(data);
            socket.broadcast.to(socket.session_id).emit(
                'send_message', data);  
        }
    });

});


process.title = 'collab_server';
