define([],
    function () {

        let extConfig = function (global) {
            let self = this;
            let map = global.extensions.extMap.map;

            self.init = function () {
                $("#config").on("click", self.handleClick);
            };

            self.handleClick = function () {
                global.extensions.extToolbar.toggleOptions("#config");

                if ($("#config").hasClass("selected")) {
                    $("#infoPanel_wrapper").css("display", "block");
                }

                let container = dijit.byId("infoPanel_container");
                container.selectChild("configPane", true);
            };
        };

        return extConfig;
    });