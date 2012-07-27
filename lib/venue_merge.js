/* Given an array of partial results in the format: 
  zoomLevel1: 
     { geopoint[s]: { latitude: 42.3605, longitude: -71.0593 },
        venues: [ [Object], [Object], ... ] }, 
  zoomLevel2:  
     { geopoint[s]:[ { latitude: 42.3605, longitude: -71.0593 },
        venues: [ [Object], [Object], ... ] },  
  ... 

  Returns a result in the format: 
     { geopoint[s]: { latitude: 42.3605, longitude: -71.0593 },
        venues: [ [Object], [Object], ... ] }
 
  The venues in the resulting object are the union of the venues of each of the
  results by zoom-level, uniquely identified by id
 */
function venue_merge(callback_result) {
  console.log("merging console resuls");
  var result = {
        geopoints : [], 
        venues : []
  }; 

  var geopoints_map = {}; 
  var venues_map = {}; 

  for (var zoom_level in callback_result) {
   if (callback_result.hasOwnProperty(zoom_level))  {
        var partial_result = callback_result[zoom_level]; 
        var points;
        if (partial_result.geopoints) {
            points = partial_result.geopoints;
        } else {
            points = [partial_result.geopoint];
        }

        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            geopoints_map['lat' + point.latitude + 
                          'lon' + point.longitude] = point; 
        }

        for (var venue_num in partial_result.venues) {
            var venue = partial_result.venues[venue_num]; 
            venues_map[venue.id] = venue;
        }
    }
  }
  
  /* geopoints_map now contains a mapping from geo_id to geopoint for all geopoints
     across partial results. Now, collect them into a single geopoints array */
  for (var geo_id in geopoints_map) {
    if (geopoints_map.hasOwnProperty(geo_id)) {
        result.geopoints.push(geopoints_map[geo_id]);
    } 
  }

  /* venues_map now contains a mapping from venue_id to venue for all venues
     across partial results. Now, collect them into a single venue array */
  for (var venue_id in venues_map) {
    if (venues_map.hasOwnProperty(venue_id)) {
        result.venues.push(venues_map[venue_id]);
    } 
  }

  return result;
}

if (typeof exports !== 'undefined') {
    exports.venue_merge = venue_merge;
}
