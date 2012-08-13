var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var jQuery = require('jquery');
var search = require("./search.js");
var venue_find = require("./venue_find.js").venue_find;
var venue_merge = require("../lib/venue_merge.js").venue_merge;
var parallel_load = require("../lib/parallel_load.js").parallel_load;


/*
  Foursquare Venues API

  https://developer.foursquare.com/docs/venues/search

  venues server: receives an object of the form
    { latitude: 42.3605, longitude: -71.0593 }
  and returns one of the form
    { geopoint: { latitude: 42.3605, longitude: -71.0593 },
      venues: [ [Object], [Object], ... ] }
*/
http.createServer(
function (req, res) {
    var url_parts = url.parse(req.url, true);
    var latitude = url_parts.query.latitude;
    var longitude = url_parts.query.longitude;
    console.log('Processing venue_find request for (' 
        + latitude + ', ' + longitude + ')');

    res.writeHead(200, 
        {'Content-Type' : 'application/json',
         'Access-Control-Allow-Origin': '*'});

    var point = {
        "latitude":latitude, 
        "longitude":longitude
    };


    var partial_callback = function(id, res) {};
    var final_callback = function(processed_venues) {
        res.end(JSON.stringify(processed_venues));
    };

    search.venue_search([point],
                        [500, 1000, 2000, 3000],
                        partial_callback,
                        final_callback);
/*
    var parallel = new parallel_load(function(total_result) { 
        var processed_venues = venue_merge(total_result);
        console.log("Returning " + processed_venues.venues.length + " venues from Foursquare"); 
        res.end(JSON.stringify(processed_venues)); 
    }); 

    var point = {
        "latitude":latitude, 
        "longitude":longitude
    };

    var partialCallback = function(id, res) {};
    
    venue_find(point, 50, 500, parallel.add(500, partialCallback)); 
    venue_find(point, 50, 1000, parallel.add(1000, partialCallback)); 
    venue_find(point, 50, 2000, parallel.add(2000, partialCallback)); 
    venue_find(point, 50, 3000, parallel.add(3000, partialCallback)); 
*/

}).listen(4000); 

/*
  NOMINATIM 
  
  http://wiki.openstreetmap.org/wiki/Nominatim

  address server: receives an object of the form 
    { address: '77 Massachusetts Avenue, Cambridge, MA 02139' } 
  and returns one of the form:
    { latitude: 42.3605, longitude: -71.0593 }
*/
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

/*
  Google Geocoding API
 
  https://developers.google.com/maps/documentation/geocoding/

  address server: receives an object of the form 
    { address: '77 Massachusetts Avenue, Cambridge, MA 02139' } 
  and returns one of the form:
    { latitude: 42.3605, longitude: -71.0593 }
*/
http.createServer(
function (req, res) {
    var url_parts = url.parse(req.url, true);
    var address = url_parts.query.address;
    console.log("Processing map_find request for " + url_parts.query.address);

    res.writeHead(200, 
        {'Content-Type' : 'application/json',
         'Access-Control-Allow-Origin': '*'});
    
    search.google_search(address, function(points) {
        res.end(JSON.stringify(points));
    });
}).listen(3500); 


process.title = 'address_server';
console.log("listening");
