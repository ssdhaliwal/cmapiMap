define(["esri/map", "esri/geometry/Extent"],
    function (esriMap, Extent) {

        let extMap = function (global) {
            let self = this;
            self.map = null;

            self.init = function () {
                self.map = new esriMap("map", {
                    basemap: "streets",
                    extent: new Extent({
                        "xmin": -16045622,
                        "ymin": -811556,
                        "xmax": 7297718,
                        "ymax": 11142818,
                        "spatialReference": {
                            "wkid": 102100
                        }
                    }),
                    showLabels: true,
                    infoWindow: global.popup
                });
                self.map.infoWindow.resize(350, 240);

                // add to allow double-click without zoom
                self.map.disableDoubleClickZoom();
                self.regiserEvents();
            };

            self.handleClick = function () {
            };

            self.regiserEvents = function () {
                self.map.on("extent-change", function (evt) {
                    self.redrawGraphics();
                });

                self.map.on("resize", function (evt) {
                    self.redrawGraphics();
                });

                self.map.on("load", function (evt) {
                    global.initialize();
                    self.redrawGraphics();
                });
            }

            self.redrawGraphics = function () {
                let graphics = self.map.graphicsLayerIds;
                let graphicLayer = null;
                for (let i = 0; i < graphics.length; i++) {
                    graphicLayer = self.map.getLayer(graphics[i]);
                    graphicLayer.redraw();
                }
            };

        };

        return extMap;
    });