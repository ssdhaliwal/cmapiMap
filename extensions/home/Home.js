define(["esri/geometry/Extent", "extensions/ViewUtilities"],
    function (esriExtent, ViewUtilties) {

        let extHome = function(global) {
            let self = this;
            let map = global.extensions.extMap.map;

            self.init = function() {
                let bounds = {
                    southWest: {
                        lat: map.geographicExtent.ymin,
                        lon: map.geographicExtent.xmin
                    },
                    northEast: {
                        lat: map.geographicExtent.ymax,
                        lon: map.geographicExtent.xmax
                    }
                };
    
                let center = {
                    lat: map.geographicExtent.getCenter().y,
                    lon: map.geographicExtent.getCenter().x
                };
    
                let range = ViewUtilties.scaleToZoomAltitude(map);
                let zoom = map.getZoom();    
                
                global.extensions.data.home = {bounds: bounds, center: center, range: range, zoom: zoom};
            };

            self.handleClick = function() {
                let data = global.extensions.data.home;
                let extent = new esriExtent(data.bounds.southWest.lon,
                    data.bounds.southWest.lat,
                    data.bounds.northEast.lon,
                    data.bounds.northEast.lat,
                    map.geographicExtent.spatialReference);

                // If auto zoom, reset the entire extent.
                if (data.zoom === "auto") {
                    map.setExtent(extent, true);
                }
                // If we have a non-auto zoom, recenter the map and zoom.
                else if (typeof data.zoom !== "undefined") {
                    // Set the zoom level.
                    map.setZoom(data.zoom);

                    // Recenter the map.
                    map.centerAt(extent.getCenter());
                }
                // Otherwise, recenter the map.
                else {
                    map.centerAt(extent.getCenter());
                }
            };
        };

        return extHome;
    });