
MapApp.map = function () {

  var mapAreas = Cities;
  var defaultArea = DefaultCity;

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
  var map;

  var leafletFunctions = {
    /*
    * Initializes the map
    */
    initialize: function () {

      $('#map').addClass('map-leaflet');

      // create the map
      var center = mapAreas[defaultArea].center;
      map = new L.Map("map", {
        center: new L.LatLng(
          center.latitude,
          center.longitude
        ),
        zoom: mapZooms.defaultZoom,
        inertia: false
      });

      var tileLayer = new L.TileLayer(
        Hosts.tiles, {
          maxZoom: mapZooms.max,
          minZoom: mapZooms.min
        }
      );
      map.addLayer(layerGroup);
      map.addLayer(tileLayer);

      // add map attributions
      map.attributionControl.setPrefix(
        'Powered by <a href="http://leaflet.cloudmade.com">Leaflet</a>, ' +
        '<a href="http://foursquare.com">Foursquare</a>, ' +
        'and <a href="http://www.google.com">Google</a>'
      );
      map.attributionControl.addAttribution(
        'Map Data &copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a>'
      );

      // add listener function to redraw geopoints
      // and venues on zoom change
      map.on('zoomend', function () {
        MapApp.map.clearMarkers();
        renderGeopoints(storedGeopoints);
        renderVenues(storedVenues);
      });
    },
    /*
    * Sets the map's center coordinate
    */
    setCenter: function (center) {
      map.panTo(
        new L.LatLng(
          center.latitude,
          center.longitude
        ),
        true
      );
    },
    /*
    * Sets the map's zoom level
    */
    setZoom: function (zoom) {
      map.setZoom(zoom, true);
    },
    /*
    * Sets the map's center coordinate and zoom level
    */
    setView: function (center, zoom, silent) {
      map.setView(
        new L.LatLng(center.latitude, center.longitude),
        zoom,
        false,
        silent
      );
    },
    /*
    * Gets the map's center coordinate
    */
    getCenter: function () {
      var center = map.getCenter();
      return {
        latitude: center.lat,
        longitude: center.lng
      };
    },
    /*
    * Gets the map's zoom level
    */
    getZoom: function () {
      return map.getZoom();
    },
    /*
    * Gets the map's corner coordinate
    */
    getCorner: function () {
      var corner = map.getBounds().getNorthWest();
      return {
        latitude: corner.lat,
        longitude: corner.lng
      };
    },
    /*
    * Checks if the given point is inside any of the map areas
    */
    inBounds: function (point) {
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
    },
    /*
    * Adds a marker on the map at the given point
    */
    addMarker: function (point, markerImage, venueInfo) {
      var markerLoc = new L.LatLng(point.latitude, point.longitude);
      var url = 'images/markers/color-pin.png';
      var icon = markerImage;
      var marker = new L.Marker(
        markerLoc, {
          icon: icon
        }
      );

      if (typeof(venueInfo) !== "undefined") {
        var iconImg = null;
        if (venueInfo.icon) {
          iconImg = venueInfo.icon.prefix + "32.png";
        }

        marker.bindPopup(
          popupHtml(
            iconImg,
            venueInfo.name,
            venueInfo.stars,
            venueInfo.address)).openPopup();
      }

      layerGroup.addLayer(marker);
      return markerLoc;
    },
    /*
    * Clears all the markers from the map
    */
    clearMarkers: function () {
      layerGroup.clearLayers();
    },
    /*
    * Represents the image for a geopoint marker
    */
    geopointImage: L.icon({
      iconUrl: 'images/markers/pink-pin.png',
      shadowUrl: null,
      iconSize: new L.Point(16, 28),
      iconAnchor: new L.Point(8, 28),
      popupAnchor: new L.Point(0, - 28)
    }),
    /*
    * Represents the image for a venue marker
    */
    venueImage: L.icon({
      iconUrl: 'images/markers/blue-pin.png',
      shadowUrl: null,
      iconSize: new L.Point(16, 28),
      iconAnchor: new L.Point(8, 28),
      popupAnchor: new L.Point(0, - 28)
    }),
    /*
    * Enables the collaboration listeners
    */
    enableCollabListeners: function () {
      map.on('dragend', sendChangeCenter);
      map.on('collabend', sendChangeState);
    }
  };

  var googleFunctions = {
    initialize: function () {

      $('#map').addClass('map-google');

      // create the map
      var center = mapAreas[defaultArea].center;
      var mapOptions = {
        center: new google.maps.LatLng(
          center.latitude,
          center.longitude
        ),
        zoom: mapZooms.defaultZoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.HYBRID,
            google.maps.MapTypeId.SATELLITE
          ]
        },
        rotateControl: false,
        streetViewControl: false,
        tilt: 0
      };

      map = new google.maps.Map(
        document.getElementById('map'),
        mapOptions
      );

      // add listener function to redraw geopoints
      // and venues on zoom change
      google.maps.event.addListener(map, 'zoom_changed', function () {
        MapApp.map.clearMarkers();
        renderGeopoints(storedGeopoints);
        renderVenues(storedVenues);
      });
    },
    /*
    * Sets the map's center coordinate
    */
    setCenter: function (center) {
      var currentCenter = MapApp.map.getCenter();
      if (isSameCenter(currentCenter, center)) {
        return;
      }
      map.panTo(
        new google.maps.LatLng(
          center.latitude,
          center.longitude)
      );
    },
    /*
    * Sets the map's zoom level
    */
    setZoom: function (zoom) {
      var currentZoom = MapApp.map.getZoom();
      if (currentZoom === zoom) {
        return;
      }
      map.setZoom(zoom);
    },
    /*
    * Sets the map's center coordinate and zoom level
    */
    setView: function (center, zoom, silent) {
      MapApp.map.setCenter(center);
      MapApp.map.setZoom(zoom);
    },
    /*
    * Gets the map's center coordinate
    */
    getCenter: function () {
      var center = map.getCenter();
      return {
        latitude: center.lat(),
        longitude: center.lng()
      };
    },
    /*
    * Gets the map's zoom level
    */
    getZoom: function () {
      return map.getZoom();
    },
    /*
    * Gets the map's corner coordinate
    */
    getCorner: function () {
      var corner = map.getBounds().getNorthEast();
      return {
        latitude: corner.lat(),
        longitude: corner.lng()
      };
    },
    /*
    * Checks if the given point is inside any of the map areas
    */
    inBounds: function (point) {
      return true;
    },
    /*
    * Adds a pin on the map at the given point
    */
    addMarker: function (point, markerImage, venueInfo) {
      var markerLoc = new google.maps.LatLng(
        point.latitude,
        point.longitude
      );

      var marker = new google.maps.Marker({
        position: markerLoc,
        icon: markerImage,
        map: map
      });

      if (typeof(venueInfo) !== 'undefined') {
        var icon = null;
        if (venueInfo.icon) {
          icon = venueInfo.icon.prefix + '32.png';
        }

        var infoWindow = new google.maps.InfoWindow({
          content: popupHtml(
            icon,
            venueInfo.name,
            venueInfo.stars,
            venueInfo.address
          )
        });

        google.maps.event.addListener(marker, 'click', function () {
          infoWindow.open(map, marker);
        });
      }

      shownMarkers.push(marker);
      return markerLoc;
    },
    /*
    * Clears all the markers from the map
    */
    clearMarkers: function () {
      if (shownMarkers) {
        for (var i in shownMarkers) {
          shownMarkers[i].setMap(null);
        }
        shownMarkers.length = 0;
      }
    },
    /*
    * Represents the image for a geopoint marker
    */
    geopointImage: new google.maps.MarkerImage(
      'images/markers/pink-pin.png',
      new google.maps.Size(16, 28),
      new google.maps.Point(0, 0),
      new google.maps.Point(8, 28)
    ),
    /*
    * Represents the image for a venue marker
    */
    venueImage: new google.maps.MarkerImage(
      'images/markers/blue-pin.png',
      new google.maps.Size(16, 28),
      new google.maps.Point(0, 0),
      new google.maps.Point(8, 28)
    ),
    /*
    * Enables the collaboration listeners
    */
    enableCollabListeners: function () {
      google.maps.event.addListener(map, 'zoom_changed', sendChangeZoom);
      google.maps.event.addListener(map, 'center_changed', sendChangeCenter);
    }
  };

  var setViewOnArea = function (area) {
    var center = mapAreas[area].center;
    MapApp.map.setView(center, mapZooms.defaultZoom);
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
    };

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

  var shownMarkers = [];
  var storedGeopoints = [];
  var storedVenues = [];

  var clear = function () {
    storedGeopoints = [];
    storedVenues = [];
    MapApp.map.clearMarkers();
  };

  var drawGeopoints = function (points) {
    storedGeopoints = storedGeopoints.concat(points);
    renderGeopoints(points);
  };

  var drawVenues = function (points) {
    storedVenues = storedVenues.concat(points);
    renderVenues(points);
  };

  var renderGeopoints = function (geopoints) {
    if (geopoints.length === 0) {
      return;
    }
    MapApp.log.info('Call to renderGeopoints. Received '
      + geopoints.length + ' points.');

    for (var i = 0 ; i < geopoints.length ; i++) {
      MapApp.map.addMarker(geopoints[i], MapApp.map.geopointImage);
    }
  };

  var renderVenues = function (venues) {
    if (venues.length === 0) {
      return;
    }
    MapApp.log.info('Call to renderVenues. Received '
      + venues.length + ' points.');

    venues = venues.slice(0);
    var zoomLevel = MapApp.map.getZoom();
    var center = MapApp.map.getCenter();
    var corner = MapApp.map.getCorner();
    var radiusOfInterest = distance(center, corner);
    var threshold = radiusOfInterest * 0.002;
    MapApp.log.info('zoom level: ' + zoomLevel
      + ', thresh radius: ' + threshold);

    var someoneIsSpliced = true;
    var splicedCount = 0;

    while (someoneIsSpliced) {
      someoneIsSpliced = false;
      for (var i = 0; i < venues.length; i++) {
        var venue = venues[i];
        var nearestVenueIdx = nearestNeighbor(venue, venues);
        var nearestVenue = venues[nearestVenueIdx];
        var venueIdxToSplice;

        // Decide which venue to splice between nearestVenue and venue
        // based on their popularity
        if (nearestVenue.popularity < venue.popularity) {
          venueIdxToSplice = nearestVenueIdx;
        } else {
          venueIdxToSplice = i;
        }

        if (distance(nearestVenue, venue) < threshold) {
          venues.splice(venueIdxToSplice, 1);
          someoneIsSpliced = true;
          splicedCount += 1;
        }
      }
    }

    MapApp.log.info('Spliced ' + splicedCount + ' venues');
    MapApp.log.info('Rendering ' + venues.length + ' venues');
    for (var j = 0; j < venues.length; j++) {
      var point = venues[j];
      if (MapApp.map.inBounds(point)) {
        MapApp.map.addMarker(point, MapApp.map.venueImage, point);
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
    var center = MapApp.map.getCenter();
    MapApp.collab.sendChangeCenter(center);
  };

  // Listener function for a change in map zoom level
  var sendChangeZoom = function () {
    var zoom = MapApp.map.getZoom();
    MapApp.collab.sendChangeZoom(zoom);
  };

  // Listener function for a change in map view
  var sendChangeState = function () {
    var center = MapApp.map.getCenter();
    var zoom = MapApp.map.getZoom();
    MapApp.collab.sendChangeState(center, zoom);
  };

  MapApp.collab.on('change_center', function (data) {
    MapApp.log.info('[change_center] Setting new center: ' 
      + JSON.stringify(data.center));
    MapApp.map.setCenter(data.center);
  });

  MapApp.collab.on('change_zoom', function (data) {
    MapApp.log.info('[change_zoom] Setting new zoom: ' + data.zoom);
    MapApp.map.setZoom(data.zoom);
  });

  MapApp.collab.on('change_state', function (data) {
    MapApp.log.info('[change_state] Setting new state with center: '
      + JSON.stringify(data.center) + ' and zoom: ' + data.zoom);
    MapApp.map.setView(data.center, data.zoom, true);
  });

  MapApp.collab.on('init_ack', function (data) {
    MapApp.map.enableCollabListeners();
  });

  var res = {
    defaultArea: defaultArea,
    mapZooms: mapZooms,
    setViewOnArea: setViewOnArea,
    clear: clear,
    drawGeopoints: drawGeopoints,
    drawVenues: drawVenues
  };

  for (var fn in leafletFunctions) {
    if (MapApp.useLeaflet && leafletFunctions.hasOwnProperty(fn)) {
      res[fn] = leafletFunctions[fn];
    } else if (googleFunctions.hasOwnProperty(fn)) {
      res[fn] = googleFunctions[fn];
    }
  }

  return res;

}();

// add listener to initialize map on page load
if (MapApp.useLeaflet) {
  window.addEventListener(
    'load',
    MapApp.map.initialize
  );
} else {
  google.maps.event.addDomListener(
    window,
    'load',
    MapApp.map.initialize
  );
}

