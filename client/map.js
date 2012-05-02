var MapApp = {};

MapApp.mapPoints = {
    center: {
        lat: 42.3605,
        lon: - 71.0593
    },
    upperLeft: {
        lat: 42.5711,
        lon: - 71.3916
    },
    lowerRight: {
        lat: 42.1684,
        lon: - 70.7029
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
MapApp.venuesServer = "http://www.aeternitatis.org/venue_find";
MapApp.tileStreamUrl = MapApp.tileStreamServer + "/v2/boston/{z}/{x}/{y}.png";

MapApp.inBounds = function(point) {
    return (point.latitude >= MapApp.mapPoints.lowerRight.lat && point.latitude <= MapApp.mapPoints.upperLeft.lat && point.longitude >= MapApp.mapPoints.upperLeft.lon && point.longitude <= MapApp.mapPoints.lowerRight.lon);
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
MapApp.mapPoints.center.lat, MapApp.mapPoints.center.lon);

MapApp.map.setView(MapApp.defaultCenter, MapApp.mapZooms.defaultZoom);

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
    MapApp.layerGroup.clearLayers();

    // query the address server
    $.getJSON(MapApp.addressServer, address, function(data) {

        if (data.length === 0) {
            $('#address_search_field').css('background-image', '');
            return;
        }

        for (var i = 0; i < data.length; i++) {
            var point = data[i];
            if (MapApp.inBounds(point)) {
                address.latitude = point.latitude;
                address.longitude = point.longitude;
                // query the venues server
                $.getJSON(MapApp.venuesServer, address, venuesCallback).error(errorCallback);
            }
        }
    
    }).error(errorCallback);

    return false;
}

function venuesCallback(data) {
    if (MapApp.inBounds(data.geopoint)) {
        var markerLoc = MapApp.addMarker(data.geopoint, null, "pink");
        MapApp.map.setView(markerLoc, MapApp.mapZooms.foundZoom);
    }
    for (var i = 0; i < data.venues.length; i++) {
        var point = data.venues[i];
        if (MapApp.inBounds(point)) {
            MapApp.addMarker(point, point.name, "blue");
        }
    }
    $('#address_search_field').css('background-image', '');
}

function errorCallback(data) {
    // if there is an error, set view at the default center point
    MapApp.map.setView(MapApp.defaultCenter, MapApp.mapZooms.defaultZoom).addLayer(MapApp.tileLayer);
    console.log("Error: " + data.statusText);
    console.log("Response text: " + data.responseText);
    $('#address_search_field').css('background-image', '');
}

