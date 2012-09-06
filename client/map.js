
// custom icon for the marker pins
MapApp.MarkerIcon = L.Icon.extend({
  iconUrl: 'images/markers/black-pin.png',
  shadowUrl: null,
  iconSize: new L.Point(16, 28),
  iconAnchor: new L.Point(8, 28),
  popupAnchor: new L.Point(0, - 28)
});

MapApp.map = function () {

  var mapAreas = Cities;
  var defaultArea = 'san-francisco';
  var tileStreamUrl = Hosts.tileStream + "/v2/maps/{z}/{x}/{y}.png";

  // zoom values for the different map behaviors
  var mapZooms = {
    min: 11,
    max: 18,
    defaultZoom: 13,
    foundZoom: 15
  };
  
  // create the map layers
  var layerGroup = new L.LayerGroup();
 
  /*
    Map Methods
  */

  var map = function () {
    
    // create the map
    var map = new L.Map("map");
    var tileLayer = new L.TileLayer(
      tileStreamUrl, {
        maxZoom: mapZooms.max,
        minZoom: mapZooms.min
      }
    );
    map.addLayer(layerGroup);
    map.addLayer(tileLayer);

    // add map attributions
    map.attributionControl.setPrefix(
      'Powered by <a href="http://leaflet.cloudmade.com">Leaflet</a> ' + 
      'and <a href="http://foursquare.com">Foursquare</a>'
    );  
    map.attributionControl.addAttribution(
      'Map Data &copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a>'
    );

    return map;
  }();

  var setCenter = function (center) {
    map.panTo(
      new L.LatLng(
        center.latitude, 
        center.longitude), 
      true 
    );
  };

  var setZoom = function (zoom) {
    map.setZoom(zoom, true);
  };

  var getCenter = function () {
    var center = map.getCenter();
    return {
      latitude: center.lat,
      longitude: center.lng
    }
  };

  var getZoom = function () {
    return map.getZoom();
  };

  // checks if the given point is inside any of the map areas
  var inBounds = function (point) {
    for (var area in mapAreas) {
      if (mapAreas.hasOwnProperty(area)) {
        var mapArea = mapAreas[area];
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

  var centerOn = function (center, zoom) {
    map.setView(
      new L.LatLng(center.latitude, center.longitude), 
      zoom
    );
  };
  
  var centerOnArea = function (area) {
    var center = mapAreas[area].center; 
    centerOn(center, mapZooms.defaultZoom);
  };

  var popupHtml = function (iconUrl, name, stars, address) {
    var starsHtml = function (stars) {
      var html = "";
      for (var i = 0; i < 5; i++) {
        if (i < stars) {
              html += "<span class='red-star'></span>";
        } else {
              html += "<span class='gray-star'></span>";
        }
      }
      return html;
    }

    var html =  '<div style="overflow:auto;width:100%" >';
        html +=   '<div class="venue-icon"> '; 
        if (iconUrl) {
          html +=     '<img class="venue-icon" src="' + iconUrl  + '" />';
        }
        html +=   '</div>';
        html +=   '<div class="venue-main"> '; 
        html +=     '<div style="font-weight:bold">' + name + '</div>'; 
        html +=     '<div style="height:16px">' + starsHtml(stars) + '</div>'; 
        html +=   '</div>';
        html += '</div>';
        if (address) {
          html += '<div class="venue-address">' + address + '</div>';
        }
 
        return html;
  }

  // adds a pin on the map at the given point
  var addMarker = function (point, color, venueInfo) {
    var markerLoc = new L.LatLng(point.latitude, point.longitude);
    var url = 'images/markers/color-pin.png';
    var icon = new MapApp.MarkerIcon(url.replace("color", color));
    var marker = new L.Marker(
      markerLoc, {
        icon: icon
      }
    );

    if (typeof(venueInfo) !== "undefined") {
      var icon = null; 
      if (venueInfo.icon) {
        icon = venueInfo.icon.prefix + "32.png";
      }

      marker.bindPopup(
        popupHtml(
          icon,
          venueInfo.name,
          venueInfo.stars,
          venueInfo.address)).openPopup();
    }

    layerGroup.addLayer(marker);
    return markerLoc;
  };

  /*
    Rendering methods. The map stores the points that it is
    currently rendering. A point can be either a geopoint
    or a venue. 
    
    A geopoint is a geographical coordinate in the map retrieved from 
    a geolocator search using an input address.

    A venue is a geographical coordinate that represents a place of 
    interest near a geopoint.
  */

  var storedGeopoints = null;
  var storedVenues = null;

  var clear = function () {
    storedGeopoints = null;
    storedVenues = null;
    layerGroup.clearLayers();
  };

  var drawPlaces = function (geopoints, venues) {
    storedGeopoints = geopoints;
    storedVenues = venues;
    if (geopoints) {
      renderGeopoints(geopoints);
    }
    if (venues) {
      // TODO: do not pass a new venues array
      renderVenues(venues.slice(0));
    }
  };

  // add listener function drawPlaces to zoom change event
  map.on('zoomend', function () {
    layerGroup.clearLayers();
    drawPlaces(storedGeopoints, storedVenues);
  });

  var renderGeopoints = function (geopoints) {
    MapApp.log.info('Call to renderGeopoints. Received ' + geopoints.length + ' points.');
    for (var i = 0 ; i < geopoints.length ; i++) {
      addMarker(geopoints[i], "pink");
    }
  };

  var renderVenues = function (venues) {    
    MapApp.log.info('Call to renderVenues. Received ' + venues.length + ' points.');
    var zoomLevel = map.getZoom();
    if (venues.length === 0) {
      return;
    }
    var center = map.getBounds().getCenter();
    var corner = map.getBounds().getNorthWest();
    var radiusOfInterest = distance(
      { latitude: center.lat, longitude: center.lng }, 
      { latitude: corner.lat, longitude: corner.lng }
    );
    var threshold = radiusOfInterest * 0.002;
    MapApp.log.info('zoom level: ' + zoomLevel + ', thresh radius: ' + threshold);

    var someoneIsSpliced = true;
    var splicedCount = 0;

    while (someoneIsSpliced) { 
      someoneIsSpliced = false;
      for (var i = 0; i < venues.length; i++) {
        var venue = venues[i];
        var nearestVenueIdx = nearestNeighbor(venue, venues); 
        var nearestVenue = venues[nearestVenueIdx]; 
        var venueIdxToSplice; 

        //MapApp.log.info('distance between two venues is ' 
        // + distance(nearestVenue, venue) 
        // + '. and threshold is  ' + threshold); 

        // Decide which venue to splice between nearestVenue and venue
        // based on their popularity
        if (nearestVenue.popularity < venue.popularity) {
          venueIdxToSplice = nearestVenueIdx;
        } else {
          venueIdxToSplice = i;
        } 

        if (distance(nearestVenue, venue) < threshold) {
          venues.splice(venueIdxToSplice, 1); 
          // MapApp.log.info('splicing venue at ' + nearestVenueIdx); 
          someoneIsSpliced = true;
          splicedCount += 1;
        }
      } 
    }

    MapApp.log.info('Spliced ' + splicedCount + ' venues');
    MapApp.log.info('Rendering ' + venues.length + ' venues');
    for (var i = 0; i < venues.length; i++) {
      var point = venues[i];
      if (inBounds(point)) {
        addMarker(point, "blue", point);
      }
    }
  };

  var nearestNeighbor = function (point, points) {
    var distances = $.map(points, function (point_i, i) {    
      if (point_i === point)
        return Number.MAX_VALUE; //Avoid comparing the point against itself
      else 
        return distance(point_i, point);
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
  };

  var distance = function (p1, p2) {
    return Math.pow(p1.latitude - p2.latitude, 2) 
      + Math.pow(p1.longitude - p2.longitude, 2);
  };

  /*
    Collaboration Methods 
  */

  // Listener function for a change in map center
  var sendChangeCenter = function () {
    var mapCenter = map.getCenter();
    var center = { latitude: mapCenter.lat,  longitude: mapCenter.lng };
    MapApp.collab.sendChangeCenter(center);
  };

  // Listener function for a change in map zoom level
  var sendChangeZoom = function (data) {
    var zoom = data.zoom;
    console.log("sendChangeZoom with data= " + data);
    MapApp.collab.sendChangeZoom(zoom);
  };

  // Listener function for a change in map view
  var sendChangeState = function () {
    var mapCenter = map.getCenter();
    var center = { latitude: mapCenter.lat,  longitude: mapCenter.lng };
    var zoom = map.getZoom();
    MapApp.collab.sendChangeState(center, zoom);
  };

  var enableCollabListeners = function () {
    map.on('dragend', sendChangeCenter);
    map.on('userzoomstart', function(data) {sendChangeZoom(data); });
    map.on('userviewreset', sendChangeState);
  };

  var disableCollabListeners = function () {
    map.off('dragend', sendChangeCenter);
    map.off('zoomstart', function(data) {sendChangeZoom(data); });
    map.off('userviewreset', sendChangeState);
  };

  MapApp.collab.on('change_center', function (data) {
    MapApp.log.info('[change_center] Setting new center: ' 
      + JSON.stringify(data.center));
    setCenter(data.center);
  });

  MapApp.collab.on('change_zoom', function (data) {
    MapApp.log.info('[change_zoom] Setting new zoom: ' + data.zoom);
    setZoom(data.zoom);
  });

  MapApp.collab.on('change_state', function (data) {
    MapApp.log.info('[change_state] Setting new state with center: '
      + JSON.stringify(data.center) + ' and zoom: ' + data.zoom);
    setCenter(data.center);
    setZoom(data.zoom);
  });

  MapApp.collab.on('init_ack', function (data) {
    MapApp.log.info('[init_ack] Received initialize ack for collab session: ' 
      + JSON.stringify(data));
    enableCollabListeners(); 
  });
 
  return {
    defaultArea: defaultArea,
    mapZooms: mapZooms,
    inBounds: inBounds,
    centerOn: centerOn,
    centerOnArea: centerOnArea,
    clear: clear,
    drawPlaces: drawPlaces,
    getCenter: getCenter,
    getZoom: getZoom,
  };

}();

// set initial center and zoom level
MapApp.map.centerOnArea(MapApp.map.defaultArea);


