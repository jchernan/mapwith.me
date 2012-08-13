var http = require('http');
var parallel_load = require("../lib/parallel_load.js").parallel_load;
var venue_find = require("./venue_find.js").venue_find;
/* TODO: Deprecate ? */
var venue_merge = require("../lib/venue_merge.js").venue_merge;


/* TODO: add logic for arbitrary number of geopoints */
/* TODO: Rename venue_find, venue_search */
var venue_search = function(points, radii, partial_callback, final_callback) {

    var all_venues = {};
    var num_results_per_call = 50;

    var parallel = new parallel_load(function(total_result) { 
        var processed_venues = venue_merge(total_result);
        console.log("Returning " + processed_venues.venues.length + " venues from Foursquare"); 
        final_callback(processed_venues);
    }); 

    var callback_wrapper  = function(id, res) {
        /* Only keep results that haven't been emitted before */            
        var venues = res.venues;
        var new_venues = [];
        for (var i = 0; i < venues.length; i++) {
            var venue = venues[i];
            if (! all_venues[venue.id]) {
                all_venues[venue.id] = venue;
                new_venues.push(venue);
            }
        }

        partial_callback(id, new_venues); 
    }

    for (var j = 0; j < points.length; j++) {
        var point = points[j];
        for (var i = 0; i < radii.length; i++) {
            var radius = radii[i];
            var id = { point:point, radius:radius };
            venue_find(
                    point,
                    num_results_per_call,
                    radius,
                    parallel.add(JSON.stringify(id), callback_wrapper));
        }
    }

}

var google_search = function(term, callback) {
    var options = {
        host: "maps.googleapis.com",
        port: 80,
        path: "/maps/api/geocode/json?sensor=false&address=" + escape(term), 
        method: "GET"
    };
    
    var google_response = "";

    http.get(
        options,
        function(response) {
            response.on('data', function (chunk) {
                google_response += chunk;
            });
            response.on('end', function (data) {
                parsed_result = JSON.parse(google_response);
                var points = []; 
                try {
                  var results = parsed_result.results;

                  for (var i = 0; i < results.length; i++) { 
                      var geo = results[i].geometry;
                      var point = {
                        "latitude": geo.location.lat,
                        "longitude": geo.location.lng
                      };
                
                      points.push(point);
                      console.log('Returning (' + point.latitude + ', ' + point.longitude + ')'); 
                  }

                 callback(points);
               } 
               catch (err) {
                 console.log('Error parsing Google results. Returning []')
                 callback([]);
              }
            });
        }
    );
};

exports.google_search = google_search;
exports.venue_search = venue_search;
