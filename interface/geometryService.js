define(["esri/tasks/GeometryService", "esri/geometry/webMercatorUtils", "dojo/Deferred",
    "plugins/ViewUtilities"],
    function (GeometryService, webMercatorUtils, Deferred,
        ViewUtilities) {

        let geometryService = function (globals) {
            let self = this;
            self.instance = new GeometryService(window.esriGeometryService);

            self.init = function () {
                // console.log("geometryService - init");
                self.registerEvents();
            };

            self.registerEvents = function () {
                // console.log("geometryService - registerEvents");
            };

            self.init();

        };

        return geometryService;
    });