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
            self.onMapOverlayCreate = function(request) {
                // check minimum requirement - name or id
                if (request.hasOwnProperty("name") || request.hasOwnProperty("overlayId")) {
                    if (!request.hasOwnProperty("name") || ViewUtilities.isEmpty(request.name)) {
                        request.name = request.overlayId;
                    }
                    if (!request.hasOwnProperty("overlayId") || ViewUtilities.isEmpty(request.overlayId)) {
                        request.overlayId = request.name;
                    }

                    global.plugins.extLayerlist.addOverlay(request);
                }
            };

            self.onMapOverlayRemove = function(request) {
                // check minimum requirement - name or id
                if (request.hasOwnProperty("overlayId")) {
                    global.plugins.extLayerlist.removeOverlay(request);
                }
            };

            // 2. map.feature.*
            self.onMapFeaturePlotUrl = function(request) {
                if (request.hasOwnProperty("featureId") && request.hasOwnProperty("url")) {
                    if (!ViewUtilities.isEmpty(request.featureId) && !ViewUtilities.isEmpty(request.url)) {
                        if (!request.hasOwnProperty("name") || ViewUtilities.isEmpty(request.name)) {
                            request.name = request.featureId;
                        }
                        
                        global.plugins.extLayerlist.plotFeatureUrl(request);
                    }
                }
            };

        };

        return cmapiAdapter;
    });