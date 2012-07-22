
MapApp.places = null;

var venueMerge = require("/venue_merge.js").venue_merge;

var drawPlaces = function () {
  if (MapApp.places) {
    var mergedPlaces = venueMerge(MapApp.places);
    MapApp.map.clear();
    MapApp.map.renderGeopoints(MapApp.geopoints);
    // TODO: do not pass a new venues array
    MapApp.map.renderVenues(mergedPlaces.venues.slice(0));
  }
}

// add listener function renderPlaces to zoom change event
MapApp.map.on('zoomend', drawPlaces);

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
    drawPlaces();
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

        MapApp.map.clear();
        MapApp.places = null;
        MapApp.geopoints = [];
       
        var geopointToCenter = null;

        for (var i = 0; i < data.length; i++) {
            var point = data[i];
            if (MapApp.map.inBounds(point)) {
                MapApp.geopoints.push(point);
                MapApp.map.renderGeopoints([point]);
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
            MapApp.map.centerOn(geopointToCenter, MapApp.map.mapZooms.foundZoom);
        } else {
            MapApp.hideLoader();
        }

    }).error(MapApp.errorCallback);

    return false;
};

MapApp.errorCallback = function (data) {
    // if there is an error, set view at the default center point
    MapApp.map.centerOn(MapApp.map.defaultArea);
    console.log("Error: " + data.statusText);
    console.log("Response text: " + data.responseText);
    MapApp.hideLoader();
};
