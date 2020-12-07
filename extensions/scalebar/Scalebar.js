define(["esri/dijit/Scalebar"],
    function (esriScalebar) {

        let extScalebar = function (global) {
            let self = this;
            let map = global.extensions.extMap.map;
            self.scalebar = null;

            self.init = function () {
                self.scalebar = new esriScalebar({
                    map: map,
                    attachTo: "bottom-left",
                    scalebarUnit: "dual"
                });

                self.registerEvents();
            };

            self.handleClick = function () {
            };

            self.registerEvents = function () {
            };
        };

        return extScalebar;
    });