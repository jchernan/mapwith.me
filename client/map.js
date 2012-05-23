var MapApp = {};

MapApp.mapPoints = {};

MapApp.mapPoints.sanFrancisco = {
    center: {
        latitude: 37.7785,
        longitude: -122.4192
    },
    upperLeft: {
        latitude: 38.4948,
        longitude: -123.2128
    },
    lowerRight: {
        latitude: 37.1716,
        longitude: -121.5401
    }
};

MapApp.mapPoints.boston = {
    center: {
        latitude: 42.3605,
        longitude: -71.0593
    },
    upperLeft: {
        latitude: 42.7020,
        longitude: -71.861
    },
    lowerRight: {
        latitude: 41.9510,
        longitude: -70.285
    }
};

MapApp.mapZooms = {
    min: 11,
    max: 18,
    defaultZoom: 13,
    foundZoom: 15
};

MapApp.tileStreamUrl = Hosts.tileStream + "/v2/maps/{z}/{x}/{y}.png";

MapApp.inBounds = function(point) {
    for (var area in MapApp.mapPoints) {
        if (MapApp.mapPoints.hasOwnProperty(area)) {
            var mapArea = MapApp.mapPoints[area];
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

// default center point
MapApp.defaultCenter = new L.LatLng(
    MapApp.mapPoints.sanFrancisco.center.latitude, 
    MapApp.mapPoints.sanFrancisco.center.longitude
);

// set initial center and zoom level
MapApp.map.setView(MapApp.defaultCenter, MapApp.mapZooms.defaultZoom);

// add listener function Renderer.draw() to zoom change event
MapApp.places = null;
MapApp.map.on('zoomend', Renderer.drawPlaces);

var parallel_load = require('/parallel_load.js').parallel_load;
var parallel = new parallel_load(processVenues);


function find_and_display_address() {

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
                $.getJSON(Hosts.venuesFind, point, parallel.add(i, 
                    function(id, partialRes) {
                        if (!MapApp.places) {
                            MapApp.places = {};
                        }   
                        MapApp.places[id] = partialRes;
                        Renderer.drawPlaces();
                    }
                )).error(errorCallback);
            }
        }
        
        // Render and center in one geopoint 
        if (geopointToCenter) {
            var markerLoc = new L.LatLng(geopointToCenter.latitude, geopointToCenter.longitude);
            MapApp.map.setView(markerLoc, MapApp.mapZooms.foundZoom);
        } else {
            $('#address_search_field').css('background-image', '');
        }

    }).error(errorCallback);

    return false;
}

function processVenues() {
    // Remove loading icon 
    $('#address_search_field').css('background-image', '');
}

function errorCallback(data) {
    // if there is an error, set view at the default center point
    MapApp.map.setView(MapApp.defaultCenter, MapApp.mapZooms.defaultZoom).addLayer(MapApp.tileLayer);
    console.log("Error: " + data.statusText);
    console.log("Response text: " + data.responseText);
    $('#address_search_field').css('background-image', '');
}

