define(["dojo/_base/array",
    "esri/map", "esri/layers/GraphicsLayer", "esri/geometry/Extent",
    "esri/geometry/normalizeUtils", "esri/SpatialReference",
    "esri/graphic", "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/geometry/webMercatorUtils", "dojo/Deferred",
    "plugins/ViewUtilities", "plugins/JSUtilities"],
    function (array,
        esriMap, GraphicsLayer, Extent,
        NormalizeUtils, SpatialReference,
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
            self.coordinateFormat = "DDM";
            self.cooordinateElement = $("#latlonpos");
            self.timerTimeout = null;
            self.mgrsTimeout = null;
            self.lastX = 0;
            self.lastY = 0;
            self.tmpGraphicsLayer = {};
            self.clickTracker = {};

            self.init = function () {
                // console.log("extMap - init");
                self.instance = new esriMap("map", {
                    basemap: globals.options.map.basemap,
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
                    // infoWindow: globals.popup
                });
                // self.instance.infoWindow.resize(350, 240);

                // add to allow double-click without zoom
                if (globals.options.map["dbl-click"] === true)
                    self.instance.disableDoubleClickZoom();

                self.regiserEvents();
            };

            self.regiserEvents = function () {
                // console.log("extMap - regiserEvents");
                self.instance.on("extent-change", function (evt) {
                    // console.log("extMap - extent-change");
                    self.handleRedrawGraphics();
                });

                self.instance.on("resize", function (evt) {
                    // console.log("extMap - resize");
                    self.handleRedrawGraphics();
                });

                self.instance.on("load", function (evt) {
                    // console.log("extMap - load");
                    globals.initialize();
                    self.handleRedrawGraphics();

                    let payload = {};
                    payload.status = "init";

                    self.messageService.sendMessage("map.status.initialization",
                        JSON.stringify(payload));

                    self.instance.on("update-end", function (error) {
                        // console.log("extMap - update-end");
                        payload.status = "ready";
                        self.messageService.sendMessage("map.status.initialization",
                            JSON.stringify(payload));

                        // console.log(error);

                        // ensure these events are bound only once after initialization
                        // is complete
                        if (self.initialization) {
                            self.initialization = false;

                            /*
                            self.instance.on('mouse-over', setDropEnabled);
                            self.instance.on('mouse-out', setDropDisabled);
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

                            self.instance.on("extent-change", function ($event) {
                                self.handleMapStatusRequestView();
                            });
                        }

                        self.instance.on("basemap-change", function () {
                            self.messageService.sendMessage("map.status.initialization",
                                JSON.stringify("mapSwapinProgress"));
                        });

                        self.instance.on("before-unload", function () {
                            globals.plugins.extLayerlist.handleClearAll();

                            self.messageService.sendMessage("map.status.initialization",
                                JSON.stringify("tearDown"));
                        });
                    });
                });

                self.cooordinateElement.click(function () {
                    if (self.coordinateFormat === "DDM") {
                        self.coordinateFormat = "DMS";
                    } else if (self.coordinateFormat === "DMS") {
                        self.coordinateFormat = "DD";
                    } else if (self.coordinateFormat === "DD") {
                        self.coordinateFormat = "MGRS";
                    } else {
                        self.coordinateFormat = "DDM";
                    }

                    self.handleShowCoordinates();
                });
            };

            self.handleShowCoordinates = function (event) {
                // // console.log("extMap - handleShowCoordinates");
                // Debounce some request to prevent unnecessary dom refreshing.... But also make it responsive
                clearTimeout(self.timerTimeout);
                clearTimeout(self.mgrsTimeout);

                self.timerTimeout = setTimeout(function () {
                    if (event) {
                        //the map is in web mercator but display coordinates in geographic (lat, lon)
                        var mp = webMercatorUtils.webMercatorToGeographic(event.mapPoint);

                        //display mouse coordinates
                        self.lastX = mp.x;
                        self.lastY = mp.y;
                    }

                    switch (self.coordinateFormat) {
                        case "DDM":
                            self.cooordinateElement.text("(z" + self.instance.getZoom() + ") " +
                                "[(" + self.coordinateFormat + ") lat: " +
                                JSUtilities.convertDDLatitudeToDDM(self.lastY) + ", lon: " +
                                JSUtilities.convertDDLongitudeToDDM(self.lastX) + " ]");
                            break;
                        case "DMS":
                            self.cooordinateElement.text("(z" + self.instance.getZoom() + ") " +
                                "[(" + self.coordinateFormat + ") lat: " +
                                JSUtilities.convertDDLatitudeToDMS(self.lastY) + ", lon: " +
                                JSUtilities.convertDDLongitudeToDMS(self.lastX) + " ]");
                            break;
                        case "MGRS":
                            self.cooordinateElement.text("(z" + self.instance.getZoom() + ") " +
                                "[(" + self.coordinateFormat + ") CALCULATING MGRS... ]");
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
                                        self.cooordinateElement.text("(z" + self.instance.getZoom() + ") " +
                                            "[(" + self.coordinateFormat + ") ERROR ]");
                                    }
                                });
                                deferred.promise.then(function (response) {
                                    if (self.coordinateFormat === "MGRS") {
                                        self.cooordinateElement.text("(z" + self.instance.getZoom() + ") " +
                                            "[(" + self.coordinateFormat + ") " + response[0] + " ]");
                                    }
                                });
                            }, 250);
                            break;
                        default:
                            self.cooordinateElement.text("(z" + self.instance.getZoom() + ") " +
                                "[(" + self.coordinateFormat + ") lat: " + self.lastY + ", lon: " + self.lastX + " ]");
                            break;
                    }
                }, 5);
            };

            self.handleRedrawGraphics = function () {
                // console.log("extMap - handleRedrawGraphics");
                let graphics = self.instance.graphicsLayerIds;
                let graphicLayer = null;
                for (let i = 0; i < graphics.length; i++) {
                    graphicLayer = self.instance.getLayer(graphics[i]);
                    graphicLayer.redraw();
                }
            };

            self.handleCenterLocationLatLon = function (latitude, longitude, zoom, hideAfter) {
                // console.log("extMap - handleCenterLocationLatLon");

                let point = new Point([longitude, latitude],
                    new SpatialReference({ wkid: 4326 }));
                self.handleCenterLocationPoint(point, zoom, hideAfter);
            };

            self.handleCenterLocationPoint = function (point, zoom, hideAfter) {
                // console.log("extMap - handleCenterLocationPoint");

                if (zoom) {
                    self.handleSetZoom(zoom);
                }

                self.showTempMarker(point, 18, "centerLocation", 
                    hideAfter || globals.options.map.click.hideAfter);

                // re-center the map only if marker is not in the current extent
                let extent = self.instance.geographicExtent;
                if (!extent.contains(point) || (self.instance.getZoom() !== zoom)) {
                    self.instance.centerAt(point);
                }
            };

            self.handleCenterBounds = function (bounds, zoom, hideAfter) {
                // console.log("extMap - handleCenterBounds");

                let extent = new Extent(bounds.southWest.lon,
                    bounds.southWest.lat,
                    bounds.northEast.lon,
                    bounds.northEast.lat,
                    self.instance.geographicExtent.spatialReference);

                self.handleSetExtent(extent, zoom, hideAfter);
            };

            self.handleSetExtent = function (extent, center, hideAfter) {
                // console.log("extMap - handleSetExtent");

                let showMarker = false, point;

                if ((center !== null) && (center !== undefined)) {
                    if ((center === "auto") || (center === "true")) {
                        self.instance.setExtent(extent, true);
                    } else {
                        self.handleSetZoom(center);

                        if (!Number.isNaN(hideAfter)) {
                            showMarker = true;
                        }
                        point = extent.getCenter();
                        self.instance.centerAt(point);
                    }
                } else {
                    if (!Number.isNaN(hideAfter)) {
                        showMarker = true;
                    }
                    point = extent.getCenter();
                    self.instance.centerAt(point);
                }

                if (showMarker) {
                    self.showTempMarker(point, 18, "centerLocation", hideAfter);
                }
            };

            self.handleSetScale = function (scale) {
                // console.log("extMap - handleSetScale");

                let mapScale = ViewUtilities.zoomAltitudeToScale(self.instance, scale);
                self.instance.setScale(mapScale);
            };

            self.handleSetZoom = function (zoom) {
                // console.log("extMap - handleSetZoom");

                self.instance.setZoom(zoom);
            };

            self.handleClick = function (evt, type) {
                // console.log("extMap - handleClick");

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

                    // show marker enabled?
                    if (globals.options.map.click.showMarker === true) {
                        self.showTempMarker(evt.mapPoint, 18, "mapClick", globals.options.map.click.hideAfter);
                        self.clickTracker[(new Date().getTime().toString(16))] = {
                            x: evt.mapPoint.getLongitude(),
                            y: evt.mapPoint.getLatitude()
                        };
                    }
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

            self.showTempMarker = function (point, size, name, hideAfter) {
                // console.log("extMap - showTempMarker");

                // do not display marker if undefined
                if (!hideAfter) {
                    return;
                }

                // clear old marker position from map
                if (name && (self.tmpGraphicsLayer.hasOwnProperty(name))) {
                    self.instance.removeLayer(self.tmpGraphicsLayer[name]);
                    delete self.tmpGraphicsLayer[name];
                } else if (!name) {
                    name = "tmp_marker_" + (new Date().getTime().toString(16));
                }

                // create graphics layer and marker
                self.tmpGraphicsLayer[name] = new GraphicsLayer({
                    id: name
                });
                self.instance.addLayer(self.tmpGraphicsLayer[name]);

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
                self.tmpGraphicsLayer[name].add(graphic);

                if (hideAfter && (hideAfter > 0)) {
                    window.setTimeout(function (name) {
                        try {
                            self.instance.removeLayer(self.tmpGraphicsLayer[name]);
                        } catch {}

                        delete self.tmpGraphicsLayer[name];
                    }, hideAfter, name);
                }
            };

            self.handleMapStatusRequest = function (request) {
                // console.log("extMap - handleMapStatusRequest");

                // check and send appropriate messages
                if (request.types.includes("view")) {
                    globals.plugins.extMap.handleMapStatusRequestView();
                } else if (request.types.includes("format")) {
                    globals.plugins.extMap.handleMapStatusRequestFormat();
                } else if (request.types.includes("selected")) {
                    globals.plugins.extMap.handleMapStatusRequestSelected();
                } else if (request.types.includes("about")) {
                    globals.plugins.extMap.handleMapStatusRequestAbout();
                }
            };

            self.handleMapStatusRequestView = function () {
                // console.log("extMap - handleMapStatusRequestView");

                let payload = {};

                // The map is still loading
                if (self.instance.geographicExtent === undefined) {
                    window.setTimeout(function () {
                        me.sendView(caller);
                    }, 1000);

                    return;
                }

                // adjust for IDL
                NormalizeUtils.normalizeCentralMeridian([self.instance.geographicExtent], self.geometryService, function (evt) {
                    // if polygon is returned; then format for accordingly
                    payload.bounds = [];
                    if (evt[0].hasOwnProperty("rings")) {
                        array.forEach(evt[0]["rings"], function (ring) {
                            payload.bounds.push({
                                southWest: {
                                    lat: ring[0][1],
                                    lon: ring[0][0]
                                },
                                northEast: {
                                    lat: ring[2][1],
                                    lon: ring[2][0]
                                }
                            });
                        });
                    } else {
                        payload.bounds.push({
                            southWest: {
                                lat: self.instance.geographicExtent.ymin,
                                lon: Extent.prototype._normalizeX(self.instance.geographicExtent.xmin,
                                    self.instance.geographicExtent.spatialReference._getInfo()).x
                            },
                            northEast: {
                                lat: self.instance.geographicExtent.ymax,
                                lon: Extent.prototype._normalizeX(self.instance.geographicExtent.xmax,
                                    self.instance.geographicExtent.spatialReference._getInfo()).x
                            }
                        });
                    }

                    payload.center = {
                        lat: self.instance.geographicExtent.getCenter().y,
                        lon: Extent.prototype._normalizeX(self.instance.geographicExtent.getCenter().x,
                            self.instance.geographicExtent.spatialReference._getInfo()).x
                    };

                    payload.range = ViewUtilities.scaleToZoomAltitude(self.instance);

                    payload.scale = self.instance.getScale();
                    payload.zoom = self.instance.getZoom();
                    payload.basemap = self.instance.getBasemap();
                    payload.timeExtent = self.instance.timeExent || "";

                    payload.coordinateFormat = self.coordinateFormat;

                    self.messageService.sendMessage("map.status.request.view",
                        JSON.stringify(payload));
                }, function (error) {
                    // console.log("err/extMap - handleMapStatusRequestView", error);
                });
            };

            self.handleMapStatusRequestFormat = function () {
                // console.log("extMap - handleMapStatusRequestFormat");

                let payload =
                {
                    formats: ["kml, feature, dynamic"]
                };

                self.messageService.sendMessage("map.status.request.format",
                    JSON.stringify(payload));
            };

            self.handleMapStatusRequestSelected = function () {
                // console.log("extMap - handleMapStatusRequestSelected");

                let payload =
                {
                    overlayId: "",
                    selectedFeatures: {
                        "featureId": "",
                        "selectedId": ""
                    }
                };

                self.messageService.sendMessage("map.status.request.selected",
                    JSON.stringify(payload));
            };

            self.handleMapStatusRequestAbout = function () {
                // console.log("extMap - handleMapStatusRequestAbout");

                let payload =
                {
                    version: window.esriDeployVer + "@" + window.esriDeployDate,
                    type: string["2-D"],
                    widgetName: "cmapiESRI",
                    instanceName: window.esriInstanceName,
                    universalName: window.esriUniversalName,
                    extensions: [""]
                };

                self.messageService.sendMessage("map.status.request.about",
                    JSON.stringify(payload));
            };

            self.init();
        };

        return extMap;
    });