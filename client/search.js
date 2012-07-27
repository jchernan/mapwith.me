
MapApp.search = function () {
 
  var partialPlaces = null;

  var venueMerge = require("/venue_merge.js").venue_merge;

  var parallelLoad = require('/parallel_load.js').parallel_load;

  // a parallel_load object to process the callbacks of the 
  // requests made to the venues server. the final callback 
  // is simply removing the loading icon, since the partial 
  // callbacks are doing all the work.
  var parallelProcessVenues = new parallelLoad(function () {
    // Remove loading icon 
    MapApp.searchField.hideLoader();
  });

  // partial callbacks for parallelProcessVenues
  var processVenues = function (id, partialResult)  {
    if (!partialPlaces) {
      partialPlaces = {};
    }   
    partialPlaces[id] = partialResult;
    var mergedPlaces = venueMerge(partialPlaces);

    console.log("mergedPlaces= "+ JSON.stringify(mergedPlaces));

    /*var geopoints = $.map(mergedPlaces.geopoints, function(val, i) {
        return {lat:val.latitude, lng:val.longitude};
    });

    var venues = $.map(mergedPlaces.venues, function(val, i) {
        return {lat:val.latitude, lng:val.longitude};
    });
    */
    MapApp.map.drawPlaces(mergedPlaces.geopoints, mergedPlaces.venues);
  };

  // sends a request to the address server to get the coordinates
  // of the input address. then it sends a request to the venues 
  // server to get the venues around the coordinate.
  var findAddress = function () {

    var inputField = MapApp.searchField.getInput();

    // check if input is undefined, empty, or all whitespaces 
    if (!inputField || /^\s*$/.test(inputField)) {
      MapApp.log.warn('Undefined or empty input');
      return false;
    }

    var address = {
      "address": inputField
    };

    // Show progress bar 
    MapApp.searchField.showLoader();

    // query the address server
    $.getJSON(Hosts.addressFind, address, function (data) {

      if (data.length === 0) {
        MapApp.searchField.hideLoader();
        return;
      }

      MapApp.map.clear();
      partialPlaces = null;
      var geopointToCenter = null;

      for (var i = 0; i < data.length; i++) {
        var point = data[i];
        if (MapApp.map.inBounds(point)) {
          MapApp.map.drawPlaces([point], null);
          geopointToCenter = point;
          // query the venues server
          MapApp.log.info('Sending request to venue_find for (' + 
            point.latitude + ', ' + point.longitude + ')'); 
          $.getJSON(
            Hosts.venuesFind, 
            point, 
            parallelProcessVenues.add(i, processVenues)
          ).error(errorCallback);
        }
      }
      
      // Render and center in one geopoint 
      if (geopointToCenter) {
        MapApp.map.centerOn(geopointToCenter, MapApp.map.mapZooms.foundZoom);
      } else {
        MapApp.searchField.hideLoader();
      }

    }).error(errorCallback);

    return false;
  };

  var errorCallback = function (data) {
    // if there is an error, set view at the default center point
    MapApp.log.err("Error: " + data.statusText);
    MapApp.log.err("Response text: " + data.responseText);
    MapApp.searchField.hideLoader();
  };

  return {
    findAddress: findAddress
  }

}();






