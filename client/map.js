var MapApp = {};

MapApp.mapAreas = Cities;
MapApp.defaultArea = 'san-francisco';
MapApp.tileStreamUrl = Hosts.tileStream + "/v2/maps/{z}/{x}/{y}.png";

// zoom values for the different map behaviors
MapApp.mapZooms = {
    min: 11,
    max: 18,
    defaultZoom: 13,
    foundZoom: 15
};

// checks if the given point is inside any of the map areas
MapApp.inBounds = function(point) {
    for (var area in MapApp.mapAreas) {
        if (MapApp.mapAreas.hasOwnProperty(area)) {
            var mapArea = MapApp.mapAreas[area];
            if (point.latitude >= mapArea.lowerRight.latitude 
                && point.latitude <= mapArea.upperLeft.latitude 
                && point.longitude >= mapArea.upperLeft.longitude 
                && point.longitude <= mapArea.lowerRight.longitude) {
                
                return true;
            }
        }
    }
    return false;
}

MapApp.centerOn = function(area) {
    var center = MapApp.mapAreas[area].center; 
    MapApp.map.setView(
        new L.LatLng(center.latitude, center.longitude), 
        MapApp.mapZooms.defaultZoom
    );
}

// adds a pin on the map at the given point
// TODO: improve this method, not good that it is so hardcoded
MapApp.addMarker = function(point, name, color) {
    var markerLoc = new L.LatLng(point.latitude, point.longitude);
    var url = 'images/markers/color-pin.png';
    var icon = new MapApp.MarkerIcon(url.replace("color", color));
    var marker = new L.Marker(markerLoc, {
        icon: icon
    });
    if (name != null) {
        marker.bindPopup(name).openPopup();
    }
    MapApp.layerGroup.addLayer(marker);
    return markerLoc;
}

// custom icon for the marker pins
MapApp.MarkerIcon = L.Icon.extend({
    iconUrl: 'images/markers/black-pin.png',
    shadowUrl: null,
    iconSize: new L.Point(16, 28),
    iconAnchor: new L.Point(8, 28),
    popupAnchor: new L.Point(0, - 28)
});

// tile layer
MapApp.tileLayer = new L.TileLayer(
MapApp.tileStreamUrl, {
    maxZoom: MapApp.mapZooms.max,
    minZoom: MapApp.mapZooms.min
});

// map
MapApp.layerGroup = new L.LayerGroup();
MapApp.map = new L.Map("map");
MapApp.map.addLayer(MapApp.layerGroup);
MapApp.map.addLayer(MapApp.tileLayer);

// set initial center and zoom level
MapApp.centerOn(MapApp.defaultArea);

// add listener function Renderer.draw() to zoom change event
MapApp.places = null;
MapApp.map.on('zoomend', Renderer.drawPlaces);

var parallel_load = require('/parallel_load.js').parallel_load;

// a parallel_load object to process the callbacks of the 
// requests made to the venues server. the final callback 
// is simply removing the loading icon, since the partial 
// callbacks are doing all the work.
MapApp.parallelProcessVenues = new parallel_load(function() {
    // Remove loading icon 
    $('#address_search_field').css('background-image', '');
});

// partial callbacks for parallelProcessVenues
MapApp.processVenues = function(id, partialRes)  {
    if (!MapApp.places) {
        MapApp.places = {};
    }   
    MapApp.places[id] = partialRes;
    Renderer.drawPlaces();
}

// sends a request to the address server to get the coordinates
// of the input address. then it sends a request to the venues 
// server to get the venues around the coordinate.
MapApp.findAddress = function() {

    var inputField = $('#address_search_field').val();

    // check if input is undefined, empty, or all whitespaces 
    if (!inputField || /^\s*$/.test(inputField)) {
        console.log('Undefined or empty input');
        return false;
    }

    var address = {
        "address": inputField
    };

    // Show progress bar 
    $('#address_search_field').css('background-image', 'url("images/ajax-loader.gif")');

    // query the address server
    $.getJSON(Hosts.addressFind, address, function(data) {

        if (data.length === 0) {
            $('#address_search_field').css('background-image', '');
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
                console.log('Sending request to venue_find for (' 
                    + point.latitude + ', ' + point.longitude + ')'); 
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
            $('#address_search_field').css('background-image', '');
        }

    }).error(MapApp.errorCallback);

    return false;
}

MapApp.errorCallback = function(data) {
    // if there is an error, set view at the default center point
    MapApp.centerOn(MapApp.defaultArea);
    console.log("Error: " + data.statusText);
    console.log("Response text: " + data.responseText);
    $('#address_search_field').css('background-image', '');
}

