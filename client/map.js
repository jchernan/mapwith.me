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
    return (point.latitude >= MapApp.mapPoints.lowerRight.lat 
        && point.latitude <= MapApp.mapPoints.upperLeft.lat 
        && point.longitude >= MapApp.mapPoints.upperLeft.lon 
        && point.longitude <= MapApp.mapPoints.lowerRight.lon);
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
                $.getJSON(MapApp.venuesServer, address, processVenues).error(errorCallback);
            }
        }
    
    }).error(errorCallback);

    return false;
}

function processVenues(data) {
    
    if (MapApp.inBounds(data.geopoint)) {
        MapApp.venues = data.venues;
        MapApp.geopoint = data.geopoint;
        MapApp.map.on('zoomend', Renderer.draw);
        var markerLoc = new L.LatLng(MapApp.geopoint.latitude, MapApp.geopoint.longitude);
        MapApp.map.setView(markerLoc, MapApp.mapZooms.foundZoom);
    }

    /* Remove loading icon */
    $('#address_search_field').css('background-image', '');
}

var Renderer = {};

Renderer.draw = function() {
    var zoomLevel = MapApp.map.getZoom();
    var center = MapApp.map.getBounds().getCenter();
    var corner = MapApp.map.getBounds().getNorthWest();
    Renderer.radiusOfInterest = Renderer.distance(
        { latitude: center.lat, longitude: center.lng }, 
        { latitude: corner.lat, longitude: corner.lng }
    );
    Renderer.threshRadius = Renderer.radiusOfInterest * 0.002;
    console.log('zoom level: ' + zoomLevel + ', thresh radius: ' + Renderer.threshRadius);
    
    MapApp.layerGroup.clearLayers();
    /* Render geopoint */
    Renderer.renderGeopoint(MapApp.geopoint);
    /* Render nearby locations */
    Renderer.renderVenues(MapApp.venues.slice(0), MapApp.geopoint, Renderer.threshRadius);
}

Renderer.renderGeopoint = function(geopoint) {
    MapApp.addMarker(geopoint, null, "pink");
}

Renderer.renderVenues = function(venues, geopoint, threshold) {    
    console.log('call to render venues'); 

    venues.sort(function(p1, p2) {
        return Renderer.distance(p1, geopoint) - Renderer.distance(p2, geopoint);
    });

    var someone_is_spliced = true;

    while (someone_is_spliced) { 
        someone_is_spliced = false;
        for (var i = 0; i < venues.length; i++) {
            var venue = venues[i];
            var nearest_venue_idx = Renderer.nearestNeighbor(venue, venues); 
            var nearest_venue = venues[nearest_venue_idx]; 
            console.log('distance between two venues is ' + Renderer.distance(nearest_venue, venue)); 
            console.log('. and threshold is  ' + threshold);

            if (Renderer.distance(nearest_venue, venue) < threshold) {
                venues.splice(nearest_venue_idx, 1); 
                console.log('splicing venue at ' + nearest_venue_idx); 
                someone_is_spliced = true;
            }
       } 
   }

    for (var i = 0; i < venues.length; i++) {
        var point = venues[i];
        if (MapApp.inBounds(point)) {
            MapApp.addMarker(point, point.name, "blue");
        }
    }

}

Renderer.nearestNeighbor = function(point, points) {
    var distances = $.map(points, function(point_i, i) {    
       if (point_i === point)
         return Number.MAX_VALUE; //Avoid comparing the point against itself
       else 
        return Renderer.distance(point_i, point);
    }); 

    var min_distance = Number.MAX_VALUE;
    var min_point_idx = 0;

    for (var i = 0; i < points.length; i++) {
        if (distances[i] < min_distance) {
            min_point_idx = i;
            min_distance = distances[i];            
        }
    }

    return min_point_idx;
}

Renderer.distance = function(p1, p2) {
    return Math.pow(p1.latitude - p2.latitude, 2) 
        + Math.pow(p1.longitude - p2.longitude, 2);
}

function errorCallback(data) {
    // if there is an error, set view at the default center point
    MapApp.map.setView(MapApp.defaultCenter, MapApp.mapZooms.defaultZoom).addLayer(MapApp.tileLayer);
    console.log("Error: " + data.statusText);
    console.log("Response text: " + data.responseText);
    $('#address_search_field').css('background-image', '');
}

