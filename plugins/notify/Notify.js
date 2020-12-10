define(["vendor/js/notify.min"],
    function () {

        let extNotify = function (global) {
            let self = this;
            let map = null; // global.plugins.extMap.map;

            self.init = function () {
                $.notify.addStyle("esri", {
                    // modeled after bootstrap style
                    html: "<div>\n" +
                        "<div class='title' data-notify-html='title'/>\n" +
                        "<span data-notify-text/>\n</div>"
                });

                $.notify.defaults({
                    autoHide: false,
                    clickToHide: true,
                    style: "esri",
                    globalPosition: "bottom right"
                });

                self.registerEvents();
            };

            self.handleClick = function () {
            };

            self.registerEvents = function() {

            };

            self.errorNotifier = function (msg) {
                $.notify(msg, {
                    className: "error",
                    // autoHide: true,
                    // autoHideDelay: 10000
                    clickToHide: true
                });
            };

            self.infoNotifier = function (msg) {
                $.notify(msg, {
                    className: "info",
                    autoHide: true,
                    autoHideDelay: 5000
                });
            };

            self.init();
        };

        return extNotify;
    });