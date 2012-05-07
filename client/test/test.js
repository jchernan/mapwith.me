function point(latitude, longitude) {
    var pointRet = {}; 
    pointRet.latitude = latitude; 
    pointRet.longitude = longitude; 
    return pointRet;
}

module("Nearest neighbor test");

test("Test 2", function() {
        equal(1, 2);
});


test("Distance test", function() {
        var points = [point(1,1), 
                      point(0,0), 
                      point(2,1), 
                      point(1,2), 
                      point(-1,-1)]; 

        equal(Renderer.distance(points[0], points[1]), 
              2,
              "distance between points 0 and 1 is 2"); 

        equal(Renderer.distance(points[4], points[1]),
              2,
              "distance between points 4 and 1 is 2"); 

        equal(Renderer.distance(points[1], points[1]),
             0, 
             "distance between an object and itself is zero");
        
        
        for (var i = 0; i < points.length; i++) {
            for (var j = 0; j < points.length; j++) {
                equal(Renderer.distance(points[i], points[j]),
                      Renderer.distance(points[j], points[i]),
                      "distance function is symmetric");
                for (var k = 0; k < points.length; k++) {
                    /* Test d(i,k) + d(k, j) >= d(i,j)  */
                    var d1 = Math.sqrt(Renderer.distance(points[i], points[k]));
                    var d2 = Math.sqrt(Renderer.distance(points[k], points[j]));
                    var d3 = Math.sqrt(Renderer.distance(points[i], points[j]));

                    ok(d1 + d2 >= d3,
                       "distance function satisfies triangle inequality "); 
                }
            }
        }

});


