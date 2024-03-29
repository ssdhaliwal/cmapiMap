define(["esri/dijit/Scalebar"],
    function (esriScalebar) {

        let extScalebar = function (globals) {
            let self = this;
            let map = globals.plugins.extMap.instance;
            self.instance = null;

            self.init = function () {
                // console.log("extScalebar - init");
                self.instance = new esriScalebar({
                    map: map,
                    attachTo: "bottom-left",
                    scalebarUnit: "dual"
                });

                self.registerEvents();
            };

            self.handleClick = function () {
                // console.log("extScalebar - handleClick");
            };

            self.registerEvents = function () {
                // console.log("extScalebar - registerEvents");
            };

            self.init();
        };

        return extScalebar;
    });