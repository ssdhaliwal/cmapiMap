define([],
    function () {

        let geocodingService = function (globals,service) {

            self.init = function () {
                // console.log("geocodingService - init" );
                self.registerEvents();
            };

            self.registerEvents = function () {
                // console.log("geocodingService - registerEvents" );
            };

            self.init();
        };

        return geocodingService;
    });