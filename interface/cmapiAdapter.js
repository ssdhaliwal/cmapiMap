define(["plugins/JSUtilities"],
    function (JSUtilities) {

        let cmapiAdapter = function (globals) {
            let self = this;

            self.init = function () {
                // console.log("cmapiAdapter - init");
                self.registerEvents();
            };

            self.registerEvents = function () {
                // console.log("cmapiAdapter - registerEvents");
            };

            // cmapi functions
            // 1. map.overlay.*
            self.onMapOverlayCreate = function (request) {
                // console.log("cmapiAdapter - onMapOverlayCreate");
                // check minimum requirement - name or id
                if (request.hasOwnProperty("name") || request.hasOwnProperty("overlayId")) {
                    if (!request.hasOwnProperty("name") || JSUtilities.isEmpty(request.name)) {
                        request.name = request.overlayId;
                    }
                    if (!request.hasOwnProperty("overlayId") || JSUtilities.isEmpty(request.overlayId)) {
                        request.overlayId = request.name;
                    }

                    globals.plugins.extLayerlist.handleAddOverlay(request);
                }
            };

            self.onMapOverlayRemove = function (request) {
                // console.log("cmapiAdapter - onMapOverlayRemove");
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    self.onMapOverlayHide(request);
                    globals.plugins.extLayerlist.handleRemoveOverlay(request);
                }
            };

            self.onMapOverlayHide = function (request) {
                // console.log("cmapiAdapter - onMapOverlayHide");
                // check minimum requirement - id

                if (request.hasOwnProperty("overlayId")) {
                    globals.plugins.extLayerlist.handleHideOverlay(request);
                }
            };

            self.onMapOverlayShow = function (request) {
                // console.log("cmapiAdapter - onMapOverlayShow");
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    globals.plugins.extLayerlist.handleShowOverlay(request);
                }
            };

            self.onMapOverlayUpdate = function (request) {
                // console.log("cmapiAdapter - onMapOverlayUpdate");
                self.onMapOverlayCreate(request);
            };

            // 2. map.feature.*
            self.onMapFeaturePlot = function (request) {
                // console.log("cmapiAdapter - onMapFeaturePlot");
                if (request.hasOwnProperty("featureId") && request.hasOwnProperty("url")) {
                    if (!JSUtilities.isEmpty(request.featureId) && !JSUtilities.isEmpty(request.url)) {
                        if (!request.hasOwnProperty("name") || JSUtilities.isEmpty(request.name)) {
                            request.name = request.featureId;
                        }

                        if (!request.hasOwnProperty("format")) {
                            request.format = "kml";
                        }
                        if ((request.format === "kml") || (request.format === "geojson")) {
                            if (request.hasOwnProperty("params")) {
                                request.params = {};
                            }
                            if (request.hasOwnProperty("properties")) {
                                Object.keys(request.properties).forEach(key => {
                                    request.params[key] = request.properties[key];
                                });
                                delete request.properties;
                            }

                            if (!request.hasOwnProperty("zoom")) {
                                request.zoom = false;
                            }
                            if (!request.hasOwnProperty("readOnly")) {
                                request.readOnly = true;
                            }

                            if (request.hasOwnProperty("feature")) {
                                globals.plugins.extLayerlist.handlePlotFeature(request);
                            }
                        }
                    }
                }
            };

            self.onMapFeaturePlotUrl = function (request) {
                // console.log("cmapiAdapter - onMapFeaturePlotUrl");
                if (request.hasOwnProperty("featureId") && request.hasOwnProperty("url")) {
                    if (!JSUtilities.isEmpty(request.featureId) && !JSUtilities.isEmpty(request.url)) {
                        if (!request.hasOwnProperty("name") || JSUtilities.isEmpty(request.name)) {
                            request.name = request.featureId;
                        }

                        globals.plugins.extLayerlist.handlePlotFeatureUrl(request);
                    }
                }
            };

            self.onMapFeatureRemove = function (request) {
                // console.log("cmapiAdapter - onMapFeatureRemove");

                if (request.hasOwnProperty("featureId")) {
                    request.overlayId = request.featureId;
                    self.onMapFeatureHide(request);
                    self.onMapOverlayRemove(request);
                }
            };

            self.onMapFeatureHide = function (request) {
                // console.log("cmapiAdapter - onMapFeatureHide");

                if (request.hasOwnProperty("featureId")) {
                    request.overlayId = request.featureId;
                    self.onMapOverlayHide(request);
                }
            };

            self.onMapFeatureShow = function (request) {
                // console.log("cmapiAdapter - onMapFeatureShow");
                if (request.hasOwnProperty("featureId")) {
                    request.overlayId = request.featureId;
                    self.onMapOverlayShow(request);
                }
            };

            // 3. map.view.*
            self.onMapViewZoom = function (request) {
                // console.log("cmapiAdapter - onMapViewZoom");
                if (request.hasOwnProperty("range")) {
                    globals.plugins.extMap.handleSetScale(request.range);
                } else if (request.hasOwnProperty("zoom")) {
                    globals.plugins.extMap.handleSetZoom(request.zoom);
                }
            };

            self.onMapCenterOverlay = function (request) {
                // console.log("cmapiAdapter - onMapCenterOverlay");
                if (request.hasOwnProperty("overlayId") && !JSUtilities.isEmpty(request.overlayId)) {
                    if (request.hasOwnProperty("zoom") && !JSUtilities.isEmpty(request.zoom)) {
                        globals.plugins.extLayerlist.handleCenterOverlay(request.overlayId, request.zoom);
                    } else {
                        globals.plugins.extLayerlist.handleCenterOverlay(request.overlayId, "auto");
                    }
                }
            };

            self.onMapCenterFeature = function (request) {
                // console.log("cmapiAdapter - onMapCenterFeature");

                let markerId = null;
                if (request.hasOwnProperty("markerId") && !JSUtilities.isEmpty(request.markerId)) {
                    markerId = request.hasOwnProperty("markerId");
                }

                if (request.hasOwnProperty("featureId") && !JSUtilities.isEmpty(request.featureId)) {
                    if (request.hasOwnProperty("zoom") && !JSUtilities.isEmpty(request.zoom)) {
                        globals.plugins.extLayerlist.handleCenterFeature(request.featureId, markerId, request.zoom);
                    } else {
                        globals.plugins.extLayerlist.handleCenterFeature(request.featureId, markerId, "auto");
                    }
                }
            };

            self.onMapCenterLocation = function (request) {
                // console.log("cmapiAdapter - onMapCenterLocation");
                if (request.hasOwnProperty("location")) {
                    if (request.location.hasOwnProperty("lat") && request.location.hasOwnProperty("lon")) {
                        if (!JSUtilities.isEmpty(request.location.lat) && !JSUtilities.isEmpty(request.location.lon)) {
                            let zoom, hideAfter;

                            if (request.hasOwnProperty("zoom") && !JSUtilities.isEmpty(request.zoom)) {
                                zoom = request.zoom;
                            }
                            if (request.hasOwnProperty("hideAfter") && !isNaN(request.hideAfter)) {
                                hideAfter = request.hideAfter;
                            } else {
                                hideAfter = globals.options.map.click.hideAfter;
                            }

                            globals.plugins.extMap.handleCenterLocationLatLon(request.location.lat, request.location.lon, zoom, hideAfter);
                        }
                    }
                }
            };

            self.onMapCenterBounds = function (request) {
                // console.log("cmapiAdapter - onMapCenterBounds");

                if (request.hasOwnProperty("bounds")) {
                    globals.plugins.extMap.handleCenterBounds(request.bounds, request.zoom, request.hideAfter);
                }
            };

            self.onMapViewClicked = function (request) {
                // console.log("cmapiAdapter - onMapViewClicked");

                // implemented - outgoing
            };

            self.onMapViewMouseDown = function (request) {
                // console.log("cmapiAdapter - onMapViewMouseDown");

                // implemented - outgoing
            };

            self.onMapViewMouseUp = function (request) {
                // console.log("cmapiAdapter - onMapViewMouseUp");

                // implemented - outgoing
            };

            self.onMapViewAreaSelected = function (request) {
                // console.log("cmapiAdapter - onMapViewAreaSelected");

                // pending - outgoing
            };

            // 4. map.status.*
            self.onMapStatusRequest = function (request) {
                // console.log("cmapiAdapter - onMapStatusRequest");

                // "view", "format", "selected", "about", "initialization"
                if (request.hasOwnProperty("types")) {
                    if (request.types.includes("view") || request.types.includes("format") ||
                        request.types.includes("selected") || request.types.includes("about")) {
                        globals.plugins.extMap.handleMapStatusRequest(request);
                    }
                }
            };

            // 5. map.message.*

            self.init();
        };

        return cmapiAdapter;
    });