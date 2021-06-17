define([],
    function () {

        let geometryService = function (globals,service) {

            self.init = function () {
                // console.log("geometryService - init" );
                self.registerEvents();
            };

            self.registerEvents = function () {
                // console.log("geometryService - registerEvents" );
            };

            self.init();
        };

        return geometryService;
    });