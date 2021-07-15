let globals = {
    "options": {
        "basemap": {
            "available": true
        },
        "bookmarks": {
            "available": true
        },
        "config": {
            "available": false
        },
        "datagrid": {
            "available": false,
            "mode": "ondemand"
        },
        "home": {
            "available": false
        },
        "layerlist": {
            "available": true
        },
        "legend": {
            "available": false
        },
        "map": {
            "basemap": "gray-vector",
            // The following are valid options: "streets" , "satellite" , "hybrid", "topo", "gray", "dark-gray", "oceans", 
            // "national-geographic", "terrain", "osm", "dark-gray-vector", gray-vector", "streets-vector", "streets-night-vector", 
            // "streets-relief-vector", "streets-navigation-vector" and "topo-vector". 
            // Property added at v3.3. 
            // The "terrain" and "dark-gray" options added at v3.12. 
            // The "dark-gray-vector", "gray-vector", "streets-vector", "streets-night-vector", "streets-relief-vector", 
            // "streets-navigation-vector" and "topo-vector" options were added at v3.16.
            "scalebar": true,
            "infobar": true,
            "zoombar": true,
            "click": {
                "showMarker": true,
                "hideAfter": "infinite"
            },
            "dbl-click": {
                "zoom": false
            }
        },
        "search": {
            "available": true
        },
        "toolbar": {
            "available": true
        }
    },
    "data": {
        "fontColor": "YellowGreen;#9ACD32"
    },
    "popup": {
        "fillSymbol": {
            "style": "solid",
            "color": "#A4CE67"
        },
        "markerSymbol": {
            "style": "esriSMSCircle",
            "angle": 0,
            "color": [255,255,255,64],
            "size": "12",
            "type": "esriSMS"
        },
        "titleInBody": false,
        "size": {
            "width": 350,
            "height": 240
        }
    }
};