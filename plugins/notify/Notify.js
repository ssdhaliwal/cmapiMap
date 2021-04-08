define(["vendor/js/notify.min"],
    function () {

        let extNotify = function (globals) {
            let self = this;

            self.init = function () {
                console.log("extNotify - init");
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
                console.log("extNotify - handleClick");
            };

            self.registerEvents = function() {
                console.log("extNotify - registerEvents");
            };

            self.errorNotifier = function (msg) {
                console.log("extNotify - errorNotifier");
                $.notify(msg, {
                    className: "error",
                    // autoHide: true,
                    // autoHideDelay: 10000
                    clickToHide: true
                });
            };

            self.infoNotifier = function (msg) {
                console.log("extNotify - infoNotifier");
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