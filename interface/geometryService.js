define(["esri/tasks/GeometryService", "esri/geometry/webMercatorUtils", "dojo/Deferred",
    "plugins/ViewUtilities"],
    function (GeometryService, webMercatorUtils, Deferred,
        ViewUtilities) {

        let geometryService = function (global) {
            let self = this;
            self.instance = new GeometryService(window.esriGeometryService);

            self.init = function () {
                self.registerEvents();
            };

            self.handleClick = function () {
            };

            self.registerEvents = function () {
            };

            self.init();

        };

        return geometryService;
    });