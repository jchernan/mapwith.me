
MapApp.places = null;

var parallel_load = require('/parallel_load.js').parallel_load;

// a parallel_load object to process the callbacks of the 
// requests made to the venues server. the final callback 
// is simply removing the loading icon, since the partial 
// callbacks are doing all the work.
MapApp.parallelProcessVenues = new parallel_load(function () {
    // Remove loading icon 
    MapApp.hideLoader();
});

// partial callbacks for parallelProcessVenues
MapApp.processVenues = function (id, partialRes)  {
    if (!MapApp.places) {
        MapApp.places = {};
    }   
    MapApp.places[id] = partialRes;
    Renderer.drawPlaces();
};

// sends a request to the address server to get the coordinates
// of the input address. then it sends a request to the venues 
// server to get the venues around the coordinate.
MapApp.findAddress = function () {

    var inputField = $('#address-input').val();

    // check if input is undefined, empty, or all whitespaces 
    if (!inputField || /^\s*$/.test(inputField)) {
        console.log('Undefined or empty input');
        return false;
    }

    var address = {
        "address": inputField
    };

    // Show progress bar 
    MapApp.showLoader();

    // query the address server
    $.getJSON(Hosts.addressFind, address, function (data) {

        if (data.length === 0) {
            MapApp.hideLoader();
            return;
        }

        MapApp.layerGroup.clearLayers();
        MapApp.places = null;
        MapApp.geopoints = [];
       
        var geopointToCenter = null;

        for (var i = 0; i < data.length; i++) {
            var point = data[i];
            if (MapApp.inBounds(point)) {
                MapApp.geopoints.push(point);
                Renderer.renderGeopoint(point);
                geopointToCenter = point;
                // query the venues server
                console.log('Sending request to venue_find for (' + 
                    point.latitude + ', ' + point.longitude + ')'); 
                $.getJSON(
                    Hosts.venuesFind, 
                    point, 
                    MapApp.parallelProcessVenues.add(i, MapApp.processVenues)
                ).error(MapApp.errorCallback);
            }
        }
        
        // Render and center in one geopoint 
        if (geopointToCenter) {
            var markerLoc = new L.LatLng(geopointToCenter.latitude, geopointToCenter.longitude);
            MapApp.map.setView(markerLoc, MapApp.mapZooms.foundZoom);
        } else {
            MapApp.hideLoader();
        }

    }).error(MapApp.errorCallback);

    return false;
};

MapApp.errorCallback = function (data) {
    // if there is an error, set view at the default center point
    MapApp.centerOn(MapApp.defaultArea);
    console.log("Error: " + data.statusText);
    console.log("Response text: " + data.responseText);
    MapApp.hideLoader();
};
