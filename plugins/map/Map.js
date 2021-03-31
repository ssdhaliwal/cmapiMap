define(["esri/map", "esri/geometry/Extent",
    "esri/SpatialReference", "esri/geometry/Point",
    "esri/geometry/webMercatorUtils", "dojo/Deferred",
    "plugins/ViewUtilities", "plugins/JSUtilities"],
    function (esriMap, Extent,
        SpatialReference, Point,
        webMercatorUtils, Deferred,
        ViewUtilities, JSUtilities) {

        let extMap = function (global) {
            let self = this;
            self.instance = null;
            self.messageService = global.interfaces.messageService;
            self.geometryService = global.interfaces.geometryService;
            self.coordinateFormat = "DMM";
            self.cooordinateElement = $("#latlonpos");
            self.timerTimeout = null;
            self.mgrsTimeout = null;
            self.lastX = 0;
            self.lastY = 0;

            self.init = function () {
                console.log("extMap - init");
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
                console.log("extMap - handleClick");
            };

            self.regiserEvents = function () {
                console.log("extMap - regiserEvents");
                self.instance.on("extent-change", function (evt) {
                    console.log("extMap - extent-change");
                    self.handleRedrawGraphics();
                });

                self.instance.on("resize", function (evt) {
                    console.log("extMap - resize");
                    self.handleRedrawGraphics();
                });

                self.instance.on("load", function (evt) {
                    console.log("extMap - load");
                    global.initialize();
                    self.handleRedrawGraphics();

                    let payload = {};
                    payload.status = "init";

                    self.messageService.sendMessage("map.status.initialization",
                        JSON.stringify(payload));

                    self.instance.on("update-end", function (error) {
                        console.log("extMap - update-end");
                        payload.status = "ready";
                        self.messageService.sendMessage("map.status.initialization",
                            JSON.stringify(payload));

                        console.log(error);

                        /*
                        // self.instance.on("basemap-change", sendInit);
                        self.instance.on("update-end", sendReady);
                        self.instance.on("before-unload", sendTeardown);
                        self.instance.on("basemap-change", sendMapswap);
                        self.instance.on("click", sendClick);
                        self.instance.on("mouse-down", sendMousedown);
                        self.instance.on("mouse-up", sendMouseup);
                        self.instance.on("dbl-click", sendDoubleClick);
                        self.instance.map.on("extent-change", sendStatusViewUpdate);
                        self.instance.on('mouse-up', updateMouseLocation);
                        self.instance.on('mouse-over', setDropEnabled);
                        self.instance.on('mouse-out', setDropDisabled);
                        //self.instance.on("unload", unloadHandlers);
                        */
                        self.instance.on("mouse-move", self.handleShowCoordinates);
                        self.instance.on("mouse-drag", self.handleShowCoordinates);
                    });
                });

                self.cooordinateElement.click(function () {
                    if (self.coordinateFormat === "DMM") {
                        self.coordinateFormat = "DMS";
                    } else if (self.coordinateFormat === "DMS") {
                        self.coordinateFormat = "DD";
                    } else if (self.coordinateFormat === "DD") {
                        self.coordinateFormat = "MGRS";
                    } else {
                        self.coordinateFormat = "DMM";
                    }

                    self.handleShowCoordinates();
                });
            };

            self.handleShowCoordinates = function (event) {
                // console.log("extMap - handleShowCoordinates");
                // Debounce some request to prevent unnecessary dom refreshing.... But also make it responsive
                clearTimeout(self.timerTimeout);
                clearTimeout(self.mgrsTimeout);

                self.timerTimeout = setTimeout(function () {
                    if (event) {
                        //the map is in web mercator but display coordinates in geographic (lat, lon)
                        var mp = webMercatorUtils.webMercatorToGeographic(event.mapPoint);

                        //display mouse coordinates
                        self.lastX = mp.x.toFixed(5);
                        self.lastY = mp.y.toFixed(5);
                    }

                    switch (self.coordinateFormat) {
                        case "DMM":
                            self.cooordinateElement.text("(z" + self.instance.getZoom() + ") [ lat: " +
                                JSUtilities.convertDDLatitudeToDMM(self.lastY) + ", lon: " +
                                JSUtilities.convertDDLongitudeToDMM(self.lastX) + " ]");
                            break;
                        case "DMS":
                            self.cooordinateElement.text("(z" + self.instance.getZoom() + ") [ lat: " +
                                JSUtilities.convertDDLatitudeToDMS(self.lastY) + ", lon: " +
                                JSUtilities.convertDDLongitudeToDMS(self.lastX) + " ]");
                            break;
                        case "MGRS":
                            self.cooordinateElement.text("(z" + self.instance.getZoom() + ") [ CALCULATING MGRS... ]");
                            self.mgrsTimeout = setTimeout(function () {
                                var params = {
                                    conversionType: "mgrs",
                                    coordinates: [
                                        [
                                            self.lastX,
                                            self.lastY
                                        ]
                                    ],
                                    sr: "4326"
                                };
                                var deferred = new Deferred();
                                self.geometryService.instance.toGeoCoordinateString(params, function (result) {
                                    deferred.resolve(result);
                                }, function () {
                                    if (self.coordinateFormat === "MGRS") {
                                        self.cooordinateElement.text("(z" + self.instance.getZoom() + ") [ ERROR ]");
                                    }
                                });
                                deferred.promise.then(function (response) {
                                    if (self.coordinateFormat === "MGRS") {
                                        self.cooordinateElement.text("(z" + self.instance.getZoom() + ") [ " + response[0] + " ]");
                                    }
                                });
                            }, 250);
                            break;
                        default:
                            self.cooordinateElement.text("(z" + self.instance.getZoom() + ") [ lat: " + self.lastY + ", lon: " + self.lastX + " ]");
                            break;
                    }
                }, 5);
            };

            self.handleRedrawGraphics = function () {
                console.log("extMap - handleRedrawGraphics");
                let graphics = self.instance.graphicsLayerIds;
                let graphicLayer = null;
                for (let i = 0; i < graphics.length; i++) {
                    graphicLayer = self.instance.getLayer(graphics[i]);
                    graphicLayer.redraw();
                }
            };

            self.handleCenterLocation = function (latitude, longitude, zoom) {
                console.log("extMap - handleCenterLocation");

                let point = new Point([longitude, latitude],
                    new SpatialReference({ wkid: 4326 }));
                self.handleCenterLocation(point, zoom);
            };

            self.handleCenterLocation = function (point, zoom) {
                console.log("extMap - handleCenterLocation point");

                self.instance.centerAt(point);

                if (zoom) {
                    self.instance.setZoom(zoom);
                }
            };

            self.handleSetExtent = function (extent, center) {
                console.log("extMap - handleSetExtent");

                if (JSUtilities.getBoolean(center)) {
                    self.instance.setExtent(extent, true);
                } else {
                    self.instance.centerAt(extent.getCenter());
                }
            };

            self.handleSetScale = function (scale) {
                console.log("extMap - handleSetScale");

                let mapScale = ViewUtilities.zoomAltitudeToScale(self.instance, scale);
                self.instance.setScale(mapScale);
            };

            self.handleSetZoom = function (zoom) {
                console.log("extMap - handleSetZoom");

                self.instance.setZoom(zoom);
            };

            self.init();
        };

        return extMap;
    });