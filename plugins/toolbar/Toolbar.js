define([],
    function () {

        let extToolbar = function (global) {
            let self = this;
            let map = null; // global.plugins.extMap.map;

            self.init = function () {
                self.registerEvents();
            };

            self.handleClick = function () {
                $("#map-controls1, #map-controls2").toggle();
                $("#control-slider").toggleClass("selected");

                if (!$("#control-slider").hasClass("selected")) {
                    self.toggleOptions();
                }
            };

            self.registerEvents = function () {
                $("#control-slider").on("click", self.handleClick);
            };

            self.toggleOptions = function (elementId) {
                let isSelected = false;
                if (elementId !== undefined) {
                    isSelected = $(elementId).hasClass("selected");
                }

                $("#infoPanel_wrapper").hide();
                $("#basemaps_wrapper").hide();
                $("#overlay_wrapper").hide();

                $("#basemaps, #bookmark, #legend, #config, #overlay").removeClass("selected");

                if (elementId && !isSelected) {
                    $(elementId).addClass("selected");
                }
            };

            self.init();
        };

        return extToolbar;
    });