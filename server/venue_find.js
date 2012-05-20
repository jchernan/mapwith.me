var parallel_load = require("./parallel_load.js").parallel_load;
var https = require("https");
var jQuery = require("jquery"); 

var MIN_VENUE_POPULARITY_THRESHOLD = 50;

var venue_find = function (point, num_results, radius, callback) { 
    var foursquare_client_id = 'GXSFY2MK32QDGOZW4OT3VKFFYBJRZAQWKJVJGCYTS3MZAQ4L';
    var foursquare_client_secret = 'N3JVG0VY3XW0020PPIZXTRVSWCH3TRAZOIUBR35LMQVHAOCG';

    var options = {
        host: "api.foursquare.com",
        path: "/v2/venues/search?ll=" + point.latitude + 
              escape(",") + point.longitude + 
              "&limit=" + num_results + "&radius=" + radius + "&intent=browse" + 
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
                    var address_entry = {
                        latitude : val.location.lat,
                        longitude : val.location.lng,
                        id : val.id,
                        name : val.name,
                        popularity : val.stats.checkinsCount,
                     };

                    return address_entry;
                });

                venues = venues.filter(function(venue) {
                    return venue.popularity > MIN_VENUE_POPULARITY_THRESHOLD;
	            });

                var geopoint = {
                    "latitude":point.latitude,
                    "longitude":point.longitude
                }

                response.geopoint = geopoint;
                response.venues = venues;
		
                callback(response); 

            });
        } 
    );
}


exports.venue_find = venue_find;

//var parallel = new parallel_load(function(res) { 
//        console.log(res); 
//}); 

//venue_find({latitude:42.3605, longitude:-71.0593}, 50, 1000, parallel.add(1000)); 
//venue_find({latitude:42.3605, longitude:-71.0593}, 50, 2000, parallel.add(2000)); 
