define([],
    function () {

        let geometryService = function (global, service) {

            self.init = function () {
                console.log("geometryService - init" );
                self.registerEvents();
            };

            self.registerEvents = function () {
                console.log("geometryService - registerEvents" );
            };

            self.init();
        };

        return geometryService;
    });