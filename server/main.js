var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var jQuery = require('jquery');
 
var foursquare_client_id = 'GXSFY2MK32QDGOZW4OT3VKFFYBJRZAQWKJVJGCYTS3MZAQ4L';
var foursquare_client_secret = 'N3JVG0VY3XW0020PPIZXTRVSWCH3TRAZOIUBR35LMQVHAOCG';
http.createServer(
function (req, res) {
    var url_parts = url.parse(req.url, true);
    var address = url_parts.query.address;
    var latitude = url_parts.query.latitude;
    var longitude = url_parts.query.longitude;
    console.log("Processing venue_find request for " + url_parts.query.address);

    res.writeHead(200, 
        {'Content-Type' : 'application/json',
         'Access-Control-Allow-Origin': '*'});

    var options = {
        host: "api.foursquare.com",
        path: "/v2/venues/search?ll=" + latitude + escape(",") + longitude + 
              "&limit=50&radius=1000&intent=browse" + 
              "&client_id=" + foursquare_client_id + 
	      "&client_secret=" + foursquare_client_secret+ "&v=20120429", 
        method: "GET"
    };
   
    var foursquare_response = "";

    https.get(
        options,
        function(foursquare_res) {
            foursquare_res.on('data', function (chunk) {
                foursquare_response += chunk;
            });
            foursquare_res.on('end', function (data) {
                parsed_result = JSON.parse(foursquare_response);
		var response = {}; 

		var venues = jQuery.map(parsed_result.response.venues, function(val, i) {
			var address_entry = {};
			address_entry.latitude = val.location.lat;
			address_entry.longitude= val.location.lng;
			address_entry.name = val.name;

			return address_entry;
		});
		
                var geopoint = {
			"latitude":latitude,
			"longitude":longitude
		}
                
		response.geopoint = geopoint;
		response.venues = venues;
		
		res.end(JSON.stringify(response));

            });
        } 
    );
     

}).listen(4000); 


http.createServer(
function (req, res) {
    var url_parts = url.parse(req.url, true);
    var address = url_parts.query.address;
    console.log("Processing map_find request for " + url_parts.query.address);

    res.writeHead(200, 
        {'Content-Type' : 'application/json',
         'Access-Control-Allow-Origin': '*'});

    var options = {
        host: "nominatim.openstreetmap.org",
        port: 80,
        path: "/search?format=json&q='" + escape(address) + "'", 
        method: "GET"
    };
    
    var nominatim_response = "";

    http.get(
        options,
        function(nominatim_res) {
            nominatim_res.on('data', function (chunk) {
                nominatim_response += chunk;
            });
            nominatim_res.on('end', function (data) {
                parsed_result = JSON.parse(nominatim_response);
                /* TODO: May receive more (or less) than one result */
                var points = []; 

		try { 
		    for (var i = 0; i < parsed_result.length; i++) { 
		        var point = {
			    "latitude":parsed_result[i].lat,
			    "longitude":parsed_result[i].lon
			    };
                
			    points.push(point);
			    console.log('Returning (' + point.latitude + ', ' + point.longitude + ')'); 
		    }

		    res.end(JSON.stringify(points));
		} 
		catch (err) {
		    console.log('Returning []')
	 	    res.end('[]');
		}

            });
        } 
    );
     

}).listen(3000); 


process.title = 'address_server';
console.log("listening");
