define([],
    function () {

        let extToolbar = function (global) {
            let self = this;
            let map = null; // global.extensions.extMap.map;

            self.init = function () {
                $("#control-slider").on("click", self.handleClick);
            };

            self.handleClick = function () {
                $("#map-controls1, #map-controls2").toggle();
                $("#control-slider").toggleClass("selected");

                if (!$("#control-slider").hasClass("selected")) {
                    self.toggleOptions();
                }
            };

            self.toggleOptions = function (elementId) {
                let isSelected = false;
                if (elementId !== undefined) {
                    isSelected = $(elementId).hasClass("selected");
                }
                
                $("#infoPanel_wrapper").css("display", "none");
                $("#basemaps_wrapper").hide();

                $("#basemaps, #bookmark, #legend, #config").removeClass("selected");
                
                if (elementId && !isSelected) {
                    $(elementId).addClass("selected");
                }
            }
        };

        return extToolbar;
    });