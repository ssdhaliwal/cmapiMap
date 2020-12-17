define(["esri/map", "esri/geometry/Extent"],
    function (esriMap, Extent) {

        let extMap = function (global) {
            let self = this;
            self.instance = null;

            self.init = function () {
                self.instance = new esriMap("map", {
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
                self.instance.infoWindow.resize(350, 240);

                // add to allow double-click without zoom
                self.instance.disableDoubleClickZoom();
                self.regiserEvents();
            };

            self.handleClick = function () {
            };

            self.regiserEvents = function () {
                self.instance.on("extent-change", function (evt) {
                    self.redrawGraphics();
                });

                self.instance.on("resize", function (evt) {
                    self.redrawGraphics();
                });

                self.instance.on("load", function (evt) {
                    global.initialize();
                    self.redrawGraphics();
                });
            }

            self.redrawGraphics = function () {
                let graphics = self.instance.graphicsLayerIds;
                let graphicLayer = null;
                for (let i = 0; i < graphics.length; i++) {
                    graphicLayer = self.instance.getLayer(graphics[i]);
                    graphicLayer.redraw();
                }
            };

            self.init();
        };

        return extMap;
    });