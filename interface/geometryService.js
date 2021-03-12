define(["esri/tasks/GeometryService", "esri/geometry/webMercatorUtils", "dojo/Deferred",
    "plugins/ViewUtilities"],
    function (GeometryService, webMercatorUtils, Deferred,
        ViewUtilities) {

        let geometryService = function (global) {
            let self = this;
            self.instance = new GeometryService(window.esriGeometryService);

            self.init = function () {
                console.log("geometryService - init");
                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("geometryService - handleClick");
            };

            self.registerEvents = function () {
                console.log("geometryService - registerEvents");
            };

            self.init();

        };

        return geometryService;
    });