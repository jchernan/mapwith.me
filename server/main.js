var http = require('http');
var url = require('url');
var fs = require('fs');

var nominatim_url = "http://nominatim.openstreetmap.org/search?format=json&q="; 
var positions = 
 '[ { "latitude": 42.3605, "longitude": -71.0593 }, { "latitude": 42.360, "longitude": -71.0700 } ]'; 


function getPositions(address) {
}

http.createServer(
function (req, res) {
    var url_parts = url.parse(req.url, true);
    var address = url_parts.query.address;
    console.log("Processing request for " + url_parts.query.address);

    res.writeHead(200, 
        {'Content-Type' : 'application/json',
         'Access-Control-Allow-Origin': '*'});

        //path: "/search?format=json&q='500 Memorial Drive, Cambridge, MA. USA. 02139'",
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



