define(["dijit/layout/TabContainer", "dijit/layout/ContentPane"],
    function (TabContainer, ContentPane) {

        let extDatagrid = function (global) {
            let self = this;
            let map = global.plugins.extMap.instance;
            self.instance = null;
            self.sources = [];
            self.showing = false;

            self.init = function () {
                console.log("extDatagrid - init");

                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("extDatagrid - handleClick");
                self.showing = !self.showing;

                if (self.showing) {
                    $("#datagrid_wrapper").css("display", "block");
                } else {
                    $("#datagrid_wrapper").css("display", "none");
                }

                $("#datagrid").toggleClass("selected");
            };

            self.registerEvents = function() {
                console.log("extDatagrid - registerEvents");
                $("#datagrid").on("click", function($event) {
                    console.log("extDatagrid - registerEvents/click");
                    self.handleClick();
                });
            };

            self.addTab = function(service) {
                console.log("extDatagrid - addTab");

                // auto add if feature or local kml layer type
                // currently supported; feature layers and kml - push filters to layer
                console.log(service);
            };

            self.removeTab = function(service) {
                console.log("extDatagrid - removeTab");

                // only via layer remove
                console.log(service);
            };

            self.init();
        };

        return extDatagrid;
    });