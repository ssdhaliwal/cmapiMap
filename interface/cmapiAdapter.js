define(["plugins/JSUtilities"],
    function (JSUtilities) {

        let cmapiAdapter = function (globals) {
            let self = this;

            self.init = function () {
                console.log("cmapiAdapter - init");
                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("cmapiAdapter - handleClick");
            };

            self.registerEvents = function () {
                console.log("cmapiAdapter - registerEvents");
            };

            // cmapi functions
            // 1. map.overlay.*
            self.onMapOverlayCreateUpdate = function (request) {
                console.log("cmapiAdapter - onMapOverlayCreateUpdate");
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
                console.log("cmapiAdapter - onMapOverlayRemove");
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    self.onMapOverlayHide(request);
                    globals.plugins.extLayerlist.handleRemoveOverlay(request);
                }
            };

            self.onMapOverlayHide = function (request) {
                console.log("cmapiAdapter - onMapOverlayHide");
                // check minimum requirement - id
                
                if (request.hasOwnProperty("overlayId")) {
                    globals.plugins.extLayerlist.handleHideOverlay(request);
                }
            };

            self.onMapOverlayShow = function (request) {
                console.log("cmapiAdapter - onMapOverlayShow");
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    globals.plugins.extLayerlist.handleShowOverlay(request);
                }
            };

            // 2. map.feature.*
            self.onMapFeaturePlot = function(request) {
                console.log("cmapiAdapter - onMapFeaturePlot");
            };

            self.onMapFeaturePlotUrl = function (request) {
                console.log("cmapiAdapter - onMapFeaturePlotUrl");
                if (request.hasOwnProperty("featureId") && request.hasOwnProperty("url")) {
                    if (!JSUtilities.isEmpty(request.featureId) && !JSUtilities.isEmpty(request.url)) {
                        if (!request.hasOwnProperty("name") || JSUtilities.isEmpty(request.name)) {
                            request.name = request.featureId;
                        }

                        globals.plugins.extLayerlist.handlePlotFeatureUrl(request);
                    }
                }
            };

            self.onMapFeatureRemove = function(request) {
                console.log("cmapiAdapter - onMapFeatureRemove");

                if (request.hasOwnProperty("featureId")) {
                    request.overlayId = request.featureId;
                    self.onMapFeatureHide(request);
                    self.onMapOverlayRemove(request);
                }
            };

            self.onMapFeatureHide = function(request) {
                console.log("cmapiAdapter - onMapFeatureHide");

                if (request.hasOwnProperty("featureId")) {
                    request.overlayId = request.featureId;
                    self.onMapOverlayHide(request);
                }
            };

            self.onMapFeatureShow = function(request) {
                console.log("cmapiAdapter - onMapFeatureShow");
                if (request.hasOwnProperty("featureId")) {
                    request.overlayId = request.featureId;
                    self.onMapOverlayShow(request);
                }
            };

            // 3. map.view.*
            self.onMapViewZoom = function (request) {
                console.log("cmapiAdapter - onMapViewZoom");
                if (request.hasOwnProperty("range")) {
                    globals.plugins.extMap.handleSetScale(request.range);
                } else if (request.hasOwnProperty("zoom")) {
                    globals.plugins.extMap.handleSetZoom(request.zoom);
                }
            };

            self.onMapCenterOverlay = function (request) {
                console.log("cmapiAdapter - onMapCenterOverlay");
                if (request.hasOwnProperty("overlayId") && !JSUtilities.isEmpty(request.overlayId)) {
                    if (request.hasOwnProperty("zoom") && !JSUtilities.isEmpty(request.zoom)) {
                        globals.plugins.extLayerlist.handleCenterOverlay(request.overlayId, request.zoom);
                    } else {
                        globals.plugins.extLayerlist.handleCenterOverlay(request.overlayId, "auto");
                    }
                }
            };

            self.onMapCenterFeature = function (request) {
                console.log("cmapiAdapter - onMapCenterFeature");

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
                console.log("cmapiAdapter - onMapCenterLocation");
                if (request.hasOwnProperty("location")) {
                    if (request.location.hasOwnProperty("lat") && request.location.hasOwnProperty("lon")) {
                        if (!JSUtilities.isEmpty(request.location.lat) && !JSUtilities.isEmpty(request.location.lon)) {
                            if (request.hasOwnProperty("zoom") && !JSUtilities.isEmpty(request.zoom)) {
                                globals.plugins.extMap.handleCenterLocationLatLon(request.location.lat, request.location.lon, request.zoom);
                            } else {
                                globals.plugins.extMap.handleCenterLocationLatLon(request.location.lat, request.location.lon);
                            }
                        }
                    }
                }
            };

            self.onMapCenterBounds = function (request) {
                console.log("cmapiAdapter - onMapCenterBounds");

                if (request.hasOwnProperty("bounds")) {
                    globals.plugins.extMap.handleCenterBounds(request.bounds, request.zoom);
                }
            };

            self.onMapViewClicked = function (request) {
                console.log("cmapiAdapter - onMapViewClicked");

            };

            self.onMapViewMouseDown = function (request) {
                console.log("cmapiAdapter - onMapViewMouseDown");

            };

            self.onMapViewMouseUp = function (request) {
                console.log("cmapiAdapter - onMapViewMouseUp");

            };

            self.onMapViewAreaSelected = function (request) {
                console.log("cmapiAdapter - onMapViewAreaSelected");

            };

            // 4. map.status.*

            // 5. map.message.*

            self.init();
        };

        return cmapiAdapter;
    });