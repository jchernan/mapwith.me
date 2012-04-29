var MapApp = {};

MapApp.mapPoints = {
    center = { 
        lat: 42.3605, 
        lon: -71.0593 i
    },
    upperLeft = {
        lat: 42.5711,
        lon: -71.3916
    },
    lowerRight = {
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
MapApp.tileStreamUrl = MapApp.tileStreamServer + "/v2/boston/{z}/{x}/{y}.png";

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
    mapPoints.center.lat, 
    mapPoints.center.lon
); 

map.setView(defaultCenter, MapApp.mapZooms.defaultZoom);

function find_and_display_address() {
    var input_field = $('#address_search_field').val();
    var address = {
        "address": input_field
    };

    /* Show progress bar */
    $('#address_search_field').css('background-image', 'url("ajax-loader.gif")');
    layerGroup.clearLayers();

    $.getJSON(MapApp.addressServer, address, function(data) {
        $('#address_search_field').css('background-image', '');

        for (var i = 0; i < data.length; i++) {
            var point = data[i];
            if (point.latitude >= MapApp.mapPoints.lowerRight.lat 
                && point.latitude <= MapApp.mapPoints.upperLeft.lat 
                && point.longitude >= MapApp.mapPoints.upperLeft.lon 
                && point.longitude <= MapApp.mapPoints.lowerRight.lon) {

                var markerLoc = new L.LatLng(point.latitude, point.longitude);
                var marker = new L.Marker(markerLoc);
                layerGroup.addLayer(marker);
                map.setView(markerLoc, MapApp.mapZooms.defaultFound);
            }
        }
    }).error(function(data) {
        // if there is an error, set view at the default center point
        map.setView(defaultCenter, MapApp.mapZooms.defaultZoom).addLayer(tileLayer);
        console.log("Error: " + data.statusText);
        console.log("Response text: " + data.responseText);
        $('#address_search_field').css('background-image', '');
    });

    return false;
}

