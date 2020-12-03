define([],
    function () {

        let extToolbar = function (global) {
            let self = this;
            let map = null; // global.extensions.extMap.map;

            self.init = function () {
                $("#control-slider").on("click", self.toggleControls);
            };

            self.toggleControls = function () {
                $("#map-controls1, #map-controls2").toggle();
                $("#control-slider").toggleClass("selected");
            };

            self.toggleOptions = function (elementId) {
                let isSelected = $(elementId).hasClass("selected");

                $("#bookmark, #legend").removeClass("selected");
                
                if (isSelected) {
                    $(elementId).addClass("selected");
                }
                $(elementId).toggleClass("selected");
            }
        };

        return extToolbar;
    });