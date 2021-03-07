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
            };

            self.registerEvents = function() {
                console.log("extDatagrid - registerEvents");
                $("#datagrid").on("click", function($event) {
                    console.log("extDatagrid - registerEvents/click");
                    self.handleClick();
                });
            };

            self.init();
        };

        return extDatagrid;
    });