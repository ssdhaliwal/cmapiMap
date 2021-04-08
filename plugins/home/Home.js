define(["esri/geometry/Extent", "plugins/ViewUtilities"],
    function (esriExtent, ViewUtilties) {

        let extHome = function (globals) {
            let self = this;
            let map = globals.plugins.extMap.instance;

            self.init = function () {
                console.log("extHome - init");
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

                globals.data.home = { bounds: bounds, center: center, range: range, zoom: zoom };
                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("extHome - handleClick");
                let data = globals.data.home;
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

            self.hide = function() {
                console.log("extHome - hide");

                $("#home").css("display", "none");
            };
            
            self.show = function() {
                console.log("extHome - show");

                $("#home").css("display", "block");
            };

            self.registerEvents = function () {
                console.log("extHome - registerEvents");
                $("#home").on("click", function($event) {
                    console.log("extHome - registerEvents/click");
                    self.handleClick();
                });
            };

            self.init();
        };

        return extHome;
    });