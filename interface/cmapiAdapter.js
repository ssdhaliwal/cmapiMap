define(["plugins/ViewUtilities"],
    function (ViewUtilities) {

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
                    if (!request.hasOwnProperty("name") || ViewUtilities.isEmpty(request.name)) {
                        request.name = request.overlayId;
                    }
                    if (!request.hasOwnProperty("overlayId") || ViewUtilities.isEmpty(request.overlayId)) {
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
                    if (!ViewUtilities.isEmpty(request.featureId) && !ViewUtilities.isEmpty(request.url)) {
                        if (!request.hasOwnProperty("name") || ViewUtilities.isEmpty(request.name)) {
                            request.name = request.featureId;
                        }

                        global.plugins.extLayerlist.handlePlotFeatureUrl(request);
                    }
                }
            };

            // 3. map.view.*
            self.onMapViewZoom = function (request) {
                console.log("cmapiAdapter - onMapViewZoom");
                if (request.hasOwnProperty("range") || request.hasOwnProperty("zoom")) {
                }
            };

            self.onMapCenterOverlay = function (request) {
                console.log("cmapiAdapter - onMapCenterOverlay");
                if (request.hasOwnProperty("overlayId")) {
                }
            };

            self.onMapCenterFeature = function (request) {
                console.log("cmapiAdapter - onMapCenterFeature");
                if (request.hasOwnProperty("featureId")) {
                }
            };

            self.onMapCenterLocation = function (request) {
                console.log("cmapiAdapter - onMapCenterLocation");
                if (request.hasOwnProperty("location")) {
                    if (request.location.hasOwnProperty("lat") && request.location.hasOwnProperty("lon")) {
                        if (!ViewUtilities.isEmpty(request.location.lat) && !ViewUtilities.isEmpty(request.location.lon)) {

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