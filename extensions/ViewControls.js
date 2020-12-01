define([],
    function () {

        let ViewControls = function (global) {
            let self = this;
            let map = global.map;

            self.init = function () {
                $("#control-slider").on("click", self.toggleControls);
            };

            self.toggleControls = function () {
                $("#map-controls1, #map-controls2").toggle();
                $("#control-slider").toggleClass("selected");
            };
        };

        return ViewControls;
    });