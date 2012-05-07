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
