define(["esri/map", "esri/layers/GraphicsLayer", "esri/geometry/Extent",
    "esri/SpatialReference",
    "esri/graphic", "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/geometry/webMercatorUtils", "dojo/Deferred",
    "plugins/ViewUtilities", "plugins/JSUtilities"],
    function (esriMap, GraphicsLayer, Extent,
        SpatialReference,
        Graphic, Point,
        SimpleMarkerSymbol,
        webMercatorUtils, Deferred,
        ViewUtilities, JSUtilities) {

        let extMap = function (globals) {
            let self = this;
            self.instance = null;
            self.initialization = true;
            self.messageService = globals.interfaces.messageService;
            self.geometryService = globals.interfaces.geometryService;
            self.coordinateFormat = "DMM";
            self.cooordinateElement = $("#latlonpos");
            self.timerTimeout = null;
            self.mgrsTimeout = null;
            self.lastX = 0;
            self.lastY = 0;
            self.tmpGraphicsLayer = null;

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
                    infoWindow: globals.popup
                });
                self.instance.infoWindow.resize(350, 240);

                // add to allow double-click without zoom
                self.instance.disableDoubleClickZoom();
                self.regiserEvents();
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
                    globals.initialize();
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

                        // ensure these events are bound only once after initialization
                        // is complete
                        if (self.initialization) {
                            self.initialization = false;

                            /*
                            // self.instance.on("basemap-change", sendInit);
                            self.instance.on("update-end", sendReady);
                            self.instance.on("before-unload", sendTeardown);
                            self.instance.on("basemap-change", sendMapswap);
                            self.instance.on("mouse-down", sendMousedown);
                            self.instance.on("mouse-up", sendMouseup);
                            self.instance.map.on("extent-change", sendStatusViewUpdate);
                            self.instance.on('mouse-up', updateMouseLocation);
                            self.instance.on('mouse-over', setDropEnabled);
                            self.instance.on('mouse-out', setDropDisabled);
                            //self.instance.on("unload", unloadHandlers);
                            */
                            self.instance.on("mouse-move", self.handleShowCoordinates);
                            self.instance.on("mouse-drag", self.handleShowCoordinates);

                            self.instance.on("click", function ($event) {
                                self.handleClick($event, "click");
                            });
                            self.instance.on("dbl-click", function ($event) {
                                self.handleClick($event, "dbl-click");
                            });
                            self.instance.on("mouse-down", function ($event) {
                                self.handleClick($event, "mouse-down");
                            });
                            self.instance.on("mouse-up", function ($event) {
                                self.handleClick($event, "mouse-up");
                            });
                        }
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
                                JSUtilities.convertDDLatitudeToDDM(self.lastY) + ", lon: " +
                                JSUtilities.convertDDLongitudeToDDM(self.lastX) + " ]");
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

            self.handleCenterLocationLatLon = function (latitude, longitude, zoom) {
                console.log("extMap - handleCenterLocationLatLon");

                let point = new Point([longitude, latitude],
                    new SpatialReference({ wkid: 4326 }));
                self.handleCenterLocationPoint(point, zoom);
            };

            self.handleCenterLocationPoint = function (point, zoom) {
                console.log("extMap - handleCenterLocationPoint");

                if (zoom) {
                    self.handleSetZoom(zoom);
                }

                self.showTempMarker(point);
                self.instance.centerAt(point);
            };

            self.handleCenterBounds = function (bounds, zoom) {
                console.log("extMap - handleCenterBounds");

                let extent = new Extent(bounds.southWest.lon,
                    bounds.southWest.lat,
                    bounds.northEast.lon,
                    bounds.northEast.lat,
                    self.instance.geographicExtent.spatialReference);

                self.handleSetExtent(extent, zoom);
            };

            self.handleSetExtent = function (extent, center) {
                console.log("extMap - handleSetExtent");

                if ((center !== null) && (center !== undefined)) {
                    if ((center === "auto") || (center === "true")) {
                        self.instance.setExtent(extent, true);
                    } else {
                        self.handleSetZoom(center);
                        self.instance.centerAt(extent.getCenter());
                    }
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

            self.handleClick = function (evt, type) {
                console.log("extMap - handleClick");

                var payload = {
                    lat: 0,
                    lon: 0,
                    button: "left",
                    type: "single",
                    keys: [],
                    time: new Date().getTime()
                };

                // DOM events - https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
                // button # pressed (0-5; 3=back, 4=forward are ignored)
                if (evt.button === 0) {
                } else if (evt.button === 1) {
                    payload.button = "middle";
                } else if (evt.button === 2) {
                    payload.button = "right";
                } else {
                    return;
                }

                // Calculate lat/lon from event's MapPoint.
                payload.lat = evt.mapPoint.getLatitude();
                payload.lon = evt.mapPoint.getLongitude();

                // individual function keys
                if (evt.altKey) {
                    payload.keys.push("alt");
                }
                if (evt.ctrlKey) {
                    payload.keys.push("ctrl");
                }
                if (evt.shiftKey) {
                    payload.keys.push("shift");
                }
                if (payload.keys.length === 0) {
                    payload.keys.push("none");
                }

                // validate type for multiple options
                if (type === "click") {
                    payload.type = "single";
                    self.messageService.sendMessage("map.view.clicked",
                        JSON.stringify(payload));
                } else if (type === "dbl-click") {
                    payload.type = "double";
                    self.messageService.sendMessage("map.view.clicked",
                        JSON.stringify(payload));
                } else if (type === "mouse-down") {
                    payload.type = "single";
                    self.messageService.sendMessage("map.view.mousedown",
                        JSON.stringify(payload));
                } else if (type === "mouse-up") {
                    payload.type = "single";
                    self.messageService.sendMessage("map.view.mouseup",
                        JSON.stringify(payload));
                }
            };

            self.showTempMarker = function (point, size) {
                console.log("extMap - handleSetZoom");

                if (self.tmpGraphicsLayer) {
                    self.instance.removeLayer(self.tmpGraphicsLayer);
                    self.tmpGraphicsLayer = null;
                }

                self.tmpGraphicsLayer = new GraphicsLayer({
                    id: "tmp_marker"
                });
                self.instance.addLayer(self.tmpGraphicsLayer);

                let markerSymbol = new SimpleMarkerSymbol({
                    "color": [255, 0, 58, 64],
                    "size": size || 18,
                    "angle": -30,
                    "xoffset": 0,
                    "yoffset": 0,
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "outline": {
                        "color": [255, 0, 58, 255],
                        "width": 1,
                        "type": "esriSLS",
                        "style": "esriSLSSolid"
                    }
                });
                let graphic = new Graphic(point, markerSymbol);
                self.tmpGraphicsLayer.add(graphic);

                window.setTimeout(function (point, size) {
                    self.instance.removeLayer(self.tmpGraphicsLayer);
                    self.tmpGraphicsLayer = null;

                    size -= 2;
                    if (size >= 4) {
                        self.showTempMarker(point, size);
                    }
                }, 1000, point, (size || 12));
            }

            self.init();
        };

        return extMap;
    });