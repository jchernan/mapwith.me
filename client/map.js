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
MapApp.inBounds = function (point) {
    for (var area in MapApp.mapAreas) {
        if (MapApp.mapAreas.hasOwnProperty(area)) {
            var mapArea = MapApp.mapAreas[area];
            if (point.latitude >= mapArea.lowerRight.latitude && 
                point.latitude <= mapArea.upperLeft.latitude && 
                point.longitude >= mapArea.upperLeft.longitude && 
                point.longitude <= mapArea.lowerRight.longitude) {
                
                return true;
            }
        }
    }
    return false;
};

MapApp.centerOn = function (area) {
    var center = MapApp.mapAreas[area].center; 
    MapApp.map.setView(
        new L.LatLng(center.latitude, center.longitude), 
        MapApp.mapZooms.defaultZoom
    );
};

// adds a pin on the map at the given point
// TODO: improve this method, not good that it is so hardcoded
MapApp.addMarker = function (point, name, color) {
    var markerLoc = new L.LatLng(point.latitude, point.longitude);
    var url = 'images/markers/color-pin.png';
    var icon = new MapApp.MarkerIcon(url.replace("color", color));
    var marker = new L.Marker(markerLoc, {
        icon: icon
    });
    if (name !== null) {
        marker.bindPopup(name).openPopup();
    }
    MapApp.layerGroup.addLayer(marker);
    return markerLoc;
};

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

// add map attributions
MapApp.map.attributionControl.setPrefix(
    'Powered by <a href="http://leaflet.cloudmade.com">Leaflet</a> ' + 
    'and <a href="http://foursquare.com">Foursquare</a>'
);
MapApp.map.attributionControl.addAttribution(
    'Map Data &copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a>'
);

// set initial center and zoom level
MapApp.centerOn(MapApp.defaultArea);

var Renderer = {};

var venue_merge = require("/venue_merge.js").venue_merge;

Renderer.drawPlaces = function() {

    if (!MapApp.places) {
        return;
    }
  
    MapApp.layerGroup.clearLayers();
    Renderer.renderAllGeopoints();

    var zoomLevel = MapApp.map.getZoom();
    var center = MapApp.map.getBounds().getCenter();
    var corner = MapApp.map.getBounds().getNorthWest();
    var radiusOfInterest = Renderer.distance(
        { latitude: center.lat, longitude: center.lng }, 
        { latitude: corner.lat, longitude: corner.lng }
    );
    var threshRadius = radiusOfInterest * 0.002;
    console.log('zoom level: ' + zoomLevel + ', thresh radius: ' + threshRadius);

    // first draw all venues 
    var mergedPlaces = venue_merge(MapApp.places);

    // TODO: do not pass a new venues array
    Renderer.renderVenues(mergedPlaces.venues.slice(0), threshRadius);
}

Renderer.renderAllGeopoints = function() {
    // draw all geopoints in MapApp.geopoints
    for (var i=0 ; i < MapApp.geopoints.length ; i++) {
        var point = MapApp.geopoints[i];
        Renderer.renderGeopoint(point);
    }
}

Renderer.renderGeopoint = function(geopoint) {
    console.log('Call to renderGeopoint'); 
    MapApp.addMarker(geopoint, null, "pink");
}

Renderer.renderVenues = function(venues, threshold) {    
    console.log('Call to renderVenues');
    console.log('Received ' + venues.length + ' venues');

    var someone_is_spliced = true;
    var splicedCount = 0;

    while (someone_is_spliced) { 
        someone_is_spliced = false;
        for (var i = 0; i < venues.length; i++) {
            var venue = venues[i];
            var nearest_venue_idx = Renderer.nearestNeighbor(venue, venues); 
            var nearest_venue = venues[nearest_venue_idx]; 
            var venue_idx_to_splice; 

            //console.log('distance between two venues is ' + Renderer.distance(nearest_venue, venue)); 
            //console.log('. and threshold is  ' + threshold);

            // Decide which venue to splice between nearest_venue and venue
            // based on their popularity
            if (nearest_venue.popularity < venue.popularity) {
                venue_idx_to_splice = nearest_venue_idx;
            } else {
                venue_idx_to_splice = i;
            } 

            if (Renderer.distance(nearest_venue, venue) < threshold) {
                venues.splice(venue_idx_to_splice, 1); 
                //console.log('splicing venue at ' + nearest_venue_idx); 
                someone_is_spliced = true;
                splicedCount += 1;
            }
        } 
    }

    console.log('Spliced ' + splicedCount + ' venues');
    console.log('Rendering ' + venues.length + ' venues');
    for (var i = 0; i < venues.length; i++) {
        var point = venues[i];
        if (MapApp.inBounds(point)) {
            MapApp.addMarker(point, point.name + " " + point.popularity, "blue");
            //console.log(point);
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

// add listener function Renderer.draw() to zoom change event
MapApp.map.on('zoomend', Renderer.drawPlaces);
