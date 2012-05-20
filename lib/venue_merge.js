/* Given an array of partial results in the format: 
  zoomLevel1: 
     { geopoint: { latitude: 42.3605, longitude: -71.0593 },
        venues: [ [Object], [Object], ... ] }, 
  zoomLevel2:  
     { geopoint: { latitude: 42.3605, longitude: -71.0593 },
        venues: [ [Object], [Object], ... ] },  
  ... 

  Returns a result in the format: 
     { geopoint: { latitude: 42.3605, longitude: -71.0593 },
        venues: [ [Object], [Object], ... ] }
 
  The venues in the resulting object are the union of the venues of each of the
  results by zoom-level, uniquely identified by id
 */
function venue_merge(callback_result) {
  console.log("merging console resuls");
  var result = {
        geopoint : undefined, 
        venues : []
  }; 

  var venues_map = {}; 

  for (var zoom_level in callback_result) {
   if (callback_result.hasOwnProperty(zoom_level))  {
        var partial_result = callback_result[zoom_level]; 
        result.geopoint = partial_result.geopoint; 
        for (var venue_num in partial_result.venues) {
            var venue = partial_result.venues[venue_num]; 
            venues_map[venue.id] = venue;
        }
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
