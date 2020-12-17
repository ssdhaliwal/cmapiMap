define(["esri/dijit/Scalebar"],
    function (esriScalebar) {

        let extScalebar = function (global) {
            let self = this;
            let map = global.plugins.extMap.instance;
            self.instance = null;

            self.init = function () {
                self.instance = new esriScalebar({
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

            self.init();
        };

        return extScalebar;
    });