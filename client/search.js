
MapApp.search = function () {
 
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

    MapApp.collab.sendSearch(inputField);

    return false;
  };

  var currentSearch = { cid: null, xid: null };

  MapApp.collab.on('search', function (data) {
    
    MapApp.log.info('[search] Current search is ' 
      + JSON.stringify(currentSearch));

    var singleUserMode = typeof(data.from_cid) === "undefined";
    var noCurrentSearch = !currentSearch.cid && !currentSearch.xid;
    var sameAsCurrentSearch = 
        (data.from_cid === currentSearch.cid 
        && data.xid === currentSearch.xid);

    if (!(singleUserMode || noCurrentSearch  || sameAsCurrentSearch)) {
    //if (typeof(data.from_cid) !== 'undefined' 
    //  && (data.from_cid !== currentSearch.cid 
    //    || data.xid !== currentSearch.xid)) {
      return;
    }

    var opType = data.type;
    MapApp.log.info('[search] Performing search operation "' 
      + data.type + '"');

    switch (opType) {

    case 'begin': 
      // Set client ID and transaction ID
      currentSearch.cid = data.from_cid;
      currentSearch.xid = data.xid;
      // Show loader animation in search bar
      MapApp.searchField.showLoader();
      MapApp.map.clear();
      break;
    
    case 'end':
      // Hide loader animation in search bar
      MapApp.searchField.hideLoader();
      currentSearch.cid = null;
      currentSearch.xid = null;
      break;

    case 'draw_geopoints':
      if (data.points && data.points.length > 0) {
        // draw geopoints
        MapApp.map.drawGeopoints(data.points);
        // center on the first geopoint in the list
        MapApp.map.setView(data.points[0], MapApp.map.mapZooms.foundZoom);
      }
      break;

    case 'draw_venues':
      if (data.points && data.points.length > 0) {
        MapApp.map.drawVenues(data.points); 
      }
      break;
    }
  });
  
  return {
    findAddress: findAddress
  }

}();

