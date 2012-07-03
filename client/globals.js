var Hosts = {}; 

Hosts.tileStream = "http://www.aeternitatis.org:8888";
Hosts.addressFind = "http://www.aeternitatis.org/map_find";
Hosts.venuesFind = "http://www.aeternitatis.org/venue_find";
Hosts.collaboration = "http://www.aeternitatis.org:8000";
Hosts.baseURL = "http://www.aeternitatis.org";

var SanFrancisco = {
    center: {
        latitude: 37.7785,
        longitude: -122.4192
    },
    upperLeft: {
        latitude: 38.4948,
        longitude: -123.2128
    },
    lowerRight: {
        latitude: 37.1716,
        longitude: -121.5401
    }
};

var Boston = {
    center: {
        latitude: 42.3605,
        longitude: -71.0593
    },
    upperLeft: {
        latitude: 42.7020,
        longitude: -71.861
    },
    lowerRight: {
        latitude: 41.9510,
        longitude: -70.285
    }
};

var Cities = {
    "san-francisco": SanFrancisco,
    "boston": Boston
};
