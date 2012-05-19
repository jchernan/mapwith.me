var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var jQuery = require('jquery');
var venue_find = require("./venue_find.js").venue_find; 
 
var foursquare_client_id = 'GXSFY2MK32QDGOZW4OT3VKFFYBJRZAQWKJVJGCYTS3MZAQ4L';
var foursquare_client_secret = 'N3JVG0VY3XW0020PPIZXTRVSWCH3TRAZOIUBR35LMQVHAOCG';


/* Given an array of partial results in the format: 
  zoomLevel1: 
     { geopoint: { latitude: 42.3605, longitude: -71.0593 },
        venues: [ [Object], [Object], ... ] }, 
  zoomLevel2:  
     { geopoint: { latitude: 42.3605, longitude: -71.0593 },
        venues: [ [Object], [Object], ... ] },  
  ... 

  Returns a result in the format: 
     { geopoint: { latitude: 42.3605, longitude: -71.0593 },
        venues: [ [Object], [Object], ... ] }
 
  The venues in the resulting object are the union of the venues of each of the
  results by zoom-level, uniquely identified by id
 */
function venue_merge(callback_result) {
  console.log("merging console resuls");
  var result = {
        geopoint : undefined, 
        venues : []
  }; 

  var venues_map = {}; 

  for (var zoom_level in callback_result) {
   if (callback_result.hasOwnProperty(zoom_level))  {
        var partial_result = callback_result[zoom_level]; 
        result.geopoint = partial_result.geopoint; 
        for (var venue_num in partial_result.venues) {
            var venue = partial_result.venues[venue_num]; 
            venues_map[venue.id] = venue;
        }
    }
  }
  
  /* venues_map now contains a mapping from venue_id to venue for all venues
     across partial results. Now, collect them into a single venue array */
  for (var venue_id in venues_map) {
    if (venues_map.hasOwnProperty(venue_id)) {
        result.venues.push(venues_map[venue_id]);
    } 
  }

  return result;
}


var parallel_load = require("./parallel_load.js").parallel_load;
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

    var parallel = new parallel_load(function(total_result) { 
        var processed_venues = venue_merge(total_result);
        console.log("Returning " + processed_venues.venues.length + " venues from Foursquare"); 
        res.end(JSON.stringify(processed_venues)); 
    }); 

    var point = {
        "latitude":latitude, 
        "longitude":longitude
    }; 
    
    venue_find(point, 50, 500, parallel.add(1000)); 
    venue_find(point, 50, 1000, parallel.add(1000)); 
    venue_find(point, 50, 2000, parallel.add(2000)); 
    venue_find(point, 50, 3000, parallel.add(3000)); 
    venue_find(point, 50, 4000, parallel.add(3000)); 

/*
    venue_find({"latitude":latitude, "longitude":longitude}, 50, 1000, function(response) {
        console.log("Returning " + response.venues.length + " venues from Foursquare"); 
        res.end(JSON.stringify(response));
    }); 

*/

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
