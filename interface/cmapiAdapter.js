define(["plugins/ViewUtilities"],
    function (ViewUtilities) {

        let cmapiAdapter = function (global) {
            let self = this;

            self.init = function () {
                self.registerEvents();
            };

            self.handleClick = function () {
            };

            self.registerEvents = function () {
            };

            self.init();

            // cmapi functions
            // 1. map.overlay.*
            self.onMapOverlayCreateUpdate = function (request) {
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
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    global.plugins.extLayerlist.handleRemoveOverlay(request);
                }
            };

            self.onMapOverlayHide = function (request) {
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    global.plugins.extLayerlist.handleHideOverlay(request);
                }
            };

            self.onMapOverlayShow = function (request) {
                // check minimum requirement - id
                if (request.hasOwnProperty("overlayId")) {
                    global.plugins.extLayerlist.handleShowOverlay(request);
                }
            };

            // 2. map.feature.*
            self.onMapFeaturePlotUrl = function (request) {
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
                if (request.hasOwnProperty("range") || request.hasOwnProperty("zoom")) {
                }
            };

            self.onMapCenterOverlay = function (request) {
                if (request.hasOwnProperty("overlayId")) {
                }
            };

            self.onMapCenterFeature = function (request) {
                if (request.hasOwnProperty("featureId")) {
                }
            };

            self.onMapCenterLocation = function (request) {
                if (request.hasOwnProperty("location")) {
                    if (request.location.hasOwnProperty("lat") && request.location.hasOwnProperty("lon")) {
                        if (!ViewUtilities.isEmpty(request.location.lat) && !ViewUtilities.isEmpty(request.location.lon)) {

                        }
                    }
                }
            };

            self.onMapCenterBounds = function (request) {
                if (request.hasOwnProperty("location")) {
                }
            };

            self.onMapViewClicked = function (request) {

            };

            self.onMapViewMouseDown = function (request) {

            };

            self.onMapViewMouseUp = function (request) {

            };

            self.onMapViewAreaSelected = function (request) {

            };

            // 4. map.status.*

            // 5. map.message.*

        };

        return cmapiAdapter;
    });