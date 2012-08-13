var http = require('http');

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
