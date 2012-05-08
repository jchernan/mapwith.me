function point(latitude, longitude) {
    var pointRet = {}; 
    pointRet.latitude = latitude; 
    pointRet.longitude = longitude; 
    return pointRet;
}

var points = [point(1,1), 
              point(0,0), 
              point(2,1), 
              point(1,2), 
              point(-1,-1)]; 


$(document).ready(function() { 


        module("Nearest neighbor test");

        test("Distance test", function() {

            equal(Renderer.distance(point(1,1), point(0,0)), 
                  2,
                  "distance between points (1,1) and (0,0) is 2"); 

            equal(Renderer.distance(point(-1,-1), point(0,0)),
                 2,
                 "distance between points (-1,-1) and (0,0) is 2"); 

            equal(Renderer.distance(point(25, 32), point(25,32)),
                 0, 
                 "distance between an object and itself is zero");


            for (var i = 0; i < points.length; i++) {
                for (var j = 0; j < points.length; j++) {
                    equal(Renderer.distance(points[i], points[j]),
                            Renderer.distance(points[j], points[i]),
                            "distance function is symmetric");
                    for (var k = 0; k < points.length; k++) {
                        // Test d(i,k) + d(k, j) >= d(i,j)  
                        var d1 = Math.sqrt(Renderer.distance(points[i], points[k]));
                        var d2 = Math.sqrt(Renderer.distance(points[k], points[j]));
                        var d3 = Math.sqrt(Renderer.distance(points[i], points[j]));

                        ok(d1 + d2 >= d3,
                                "distance function satisfies triangle inequality "); 
                    }
                }
            }


        });

        test("Nearest neighbor test", function() {
            deepEqual(
                  points[Renderer.nearestNeighbor(points[4], points)],
                  point(0,0),
                  "Nearest neighbor of (-1,-1) is the origin");

            deepEqual(
                  points[Renderer.nearestNeighbor(point(-10, -10), points)],
                  point(-1,-1),
                  "Nearest neighbor of (-10,-10) is (-1, -1)");

            deepEqual(
                  points[Renderer.nearestNeighbor(point(1.01, 1.98), points)],
                  point(1,2),
                  "Nearest neighbor of (1.01, 1.98) is (1,2)");

            deepEqual(
                  points[Renderer.nearestNeighbor(point(0.4, 0.4), points)],
                  point(0,0),
                  "Nearest neighbor of (0.4, 0.4) is the origin");
        });

});
