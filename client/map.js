var MapApp = {};

MapApp.mapPoints = {
    center: { 
        lat: 42.3605, 
        lon: -71.0593
    },
    upperLeft: {
        lat: 42.5711,
        lon: -71.3916
    },
    lowerRight: {
        lat: 42.1684,
        lon: -70.7029
    }
};

MapApp.mapZooms = {
    min: 11,
    max: 18,
    defaultZoom: 13,
    foundZoom: 15
};

MapApp.tileStreamServer = "http://www.aeternitatis.org:8888";
MapApp.addressServer = "http://www.aeternitatis.org/map_find";
MapApp.venueServer = "http://www.aeternitatis.org/venue_find";
MapApp.tileStreamUrl = MapApp.tileStreamServer + "/v2/boston/{z}/{x}/{y}.png";

MapApp.inBounds = function(point) {
    if (point.latitude >= MapApp.mapPoints.lowerRight.lat 
          && point.latitude <= MapApp.mapPoints.upperLeft.lat 
          && point.longitude >= MapApp.mapPoints.upperLeft.lon 
          && point.longitude <= MapApp.mapPoints.lowerRight.lon) {
        return true;
    } else {
        return false;
    }
}

// tile layer
var tileLayer = new L.TileLayer(
    MapApp.tileStreamUrl, {
        maxZoom: MapApp.mapZooms.max,
        minZoom: MapApp.mapZooms.min
    }
);

// map
var map = new L.Map("map");
var layerGroup = new L.LayerGroup();
map.addLayer(layerGroup);
map.addLayer(tileLayer);

// default center point
var defaultCenter = new L.LatLng(
    MapApp.mapPoints.center.lat, 
    MapApp.mapPoints.center.lon
); 

map.setView(defaultCenter, MapApp.mapZooms.defaultZoom);

function find_and_display_address() {
    var input_field = $('#address_search_field').val();
    var address = {
        "address": input_field
    };

    // Show progress bar 
    $('#address_search_field').css('background-image', 'url("ajax-loader.gif")');
    layerGroup.clearLayers();

    // query the address server
    $.getJSON(MapApp.addressServer, address, function(data) {
        
        for (var i = 0; i < data.length; i++) {
            var point = data[i];
            if (MapApp.inBounds(point)) {
                var markerLoc = addMarker(point, null, "pink");
                map.setView(markerLoc, MapApp.mapZooms.foundZoom);
            }
        }
    }).error(function(data) {
        // if there is an error, set view at the default center point
        map.setView(defaultCenter, MapApp.mapZooms.defaultZoom).addLayer(tileLayer);
        console.log("Error: " + data.statusText);
        console.log("Response text: " + data.responseText);
        $('#address_search_field').css('background-image', '');
    });

    // query the venues server
    $.getJSON(MapApp.venueServer, address, function(data) {

        if (MapApp.inBounds(data.geopoint)) {
            var markerLoc = addMarker(data.geopoint, null, "purple");
            map.setView(markerLoc, MapApp.mapZooms.foundZoom);
        }

        for (var i = 0; i < data.venues.length; i++) {
            var point = data.venues[i];
            if (MapApp.inBounds(point)) {
                addMarker(point, point.name, "blue");
            }
        }

        $('#address_search_field').css('background-image', '');

    }).error(function(data) {
        // if there is an error, set view at the default center point
        map.setView(defaultCenter, MapApp.mapZooms.defaultZoom).addLayer(tileLayer);
        console.log("Error: " + data.statusText);
        console.log("Response text: " + data.responseText);
        $('#address_search_field').css('background-image', '');
    });

    return false;
}

function addMarker(point, name, color) {
    var markerLoc = new L.LatLng(point.latitude, point.longitude);
    var url = 'markers/color-pin.png';
    var icon = new MapApp.MarkerIcon(url.replace("color", color));
    var marker = new L.Marker(markerLoc, {icon: icon});
    if (name != null) {
        marker.bindPopup(name).openPopup();
    }
    layerGroup.addLayer(marker);
    return markerLoc;
}

MapApp.MarkerIcon = L.Icon.extend({
    iconUrl: 'markers/black-pin.png',
    shadowUrl: null,
    iconSize: new L.Point(16, 28),
    iconAnchor: new L.Point(8, 28),
    popupAnchor: new L.Point(0, -28)
});
