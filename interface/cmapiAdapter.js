define(["plugins/JSUtilities"],
    function (JSUtilities) {

        let cmapiAdapter = function (global) {
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

                    global.plugins.extLayerlist.handleAddOverlay(request);
                }
            };

            self.onMapOverlayRemove = function (request) {
                console.log("cmapiAdapter - onMapOverlayRemove");
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    global.plugins.extLayerlist.handleRemoveOverlay(request);
                }
            };

            self.onMapOverlayHide = function (request) {
                console.log("cmapiAdapter - onMapOverlayHide");
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    global.plugins.extLayerlist.handleHideOverlay(request);
                }
            };

            self.onMapOverlayShow = function (request) {
                console.log("cmapiAdapter - onMapOverlayShow");
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    global.plugins.extLayerlist.handleShowOverlay(request);
                }
            };

            // 2. map.feature.*
            self.onMapFeaturePlotUrl = function (request) {
                console.log("cmapiAdapter - onMapFeaturePlotUrl");
                if (request.hasOwnProperty("featureId") && request.hasOwnProperty("url")) {
                    if (!JSUtilities.isEmpty(request.featureId) && !JSUtilities.isEmpty(request.url)) {
                        if (!request.hasOwnProperty("name") || JSUtilities.isEmpty(request.name)) {
                            request.name = request.featureId;
                        }

                        global.plugins.extLayerlist.handlePlotFeatureUrl(request);
                    }
                }
            };

            // 3. map.view.*
            self.onMapViewZoom = function (request) {
                console.log("cmapiAdapter - onMapViewZoom");
                if (request.hasOwnProperty("range")) {
                    global.plugins.extMap.handleSetScale(request.range);
                } else if (request.hasOwnProperty("zoom")) {
                    global.plugins.extMap.handleSetZoom(request.zoom);
                }
            };

            self.onMapCenterOverlay = function (request) {
                console.log("cmapiAdapter - onMapCenterOverlay");
                if (request.hasOwnProperty("overlayId") && !JSUtilities.isEmpty(request.overlayId)) {
                    if (request.hasOwnProperty("zoom") && !JSUtilities.isEmpty(request.zoom)) {
                        global.plugins.extLayerlist.handleCenterOverlay(request.overlayId, request.zoom);
                    } else {
                        global.plugins.extLayerlist.handleCenterOverlay(request.overlayId, null);
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
                        global.plugins.extLayerlist.handleCenterFeature(request.featureId, markerId, request.zoom);
                    } else {
                        global.plugins.extLayerlist.handleCenterFeature(request.featureId, markerId, null);
                    }
                }
            };

            self.onMapCenterLocation = function (request) {
                console.log("cmapiAdapter - onMapCenterLocation");
                if (request.hasOwnProperty("location")) {
                    if (request.location.hasOwnProperty("lat") && request.location.hasOwnProperty("lon")) {
                        if (!JSUtilities.isEmpty(request.location.lat) && !JSUtilities.isEmpty(request.location.lon)) {
                            if (request.hasOwnProperty("zoom") && !JSUtilities.isEmpty(request.zoom)) {
                                global.plugins.extMap.handleCenterLocation(request.location.lat, request.location.lon, request.zoom);
                            } else {
                                global.plugins.extMap.handleCenterLocation(request.location.lat, request.location.lon, null);
                            }
                        }
                    }
                }
            };

            self.onMapCenterBounds = function (request) {
                console.log("cmapiAdapter - onMapCenterBounds");
                if (request.hasOwnProperty("location")) {
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