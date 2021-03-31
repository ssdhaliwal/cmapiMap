define([],
    function () {

        let extToolbar = function (global) {
            let self = this;

            self.init = function () {
                console.log("extToolbar - init");
                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("extToolbar - handleClick");
                $("#map-controls1, #map-controls2").toggle();
                $("#control-slider").toggleClass("selected");

                if (!$("#control-slider").hasClass("selected")) {
                    self.toggleOptions();
                }
            };

            self.registerEvents = function () {
                console.log("extToolbar - registerEvents");
                $("#control-slider").on("click", function($event) {
                    console.log("extToolbar - registerEvents/click", $event);
                    self.handleClick()
                });
            };

            self.toggleOptions = function (elementId) {
                console.log("extToolbar - toggleOptions");
                let isSelected = false;
                if (elementId !== undefined) {
                    isSelected = $(elementId).hasClass("selected");
                }

                $("#infoPanel_wrapper").hide();
                $("#basemaps_wrapper").hide();
                $("#layerlist_wrapper").hide();

                $("#basemaps, #bookmark, #legend, #config, #layerlist").removeClass("selected");

                if (elementId && !isSelected) {
                    $(elementId).addClass("selected");
                }
            };

            self.init();
        };

        return extToolbar;
    });