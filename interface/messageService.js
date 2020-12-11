define([],
    function () {

        let messageService = function (global) {
            let self = this;
            let map = global.plugins.extMap.map;

            self.init = function () {
                self.registerEvents();
            };

            self.handleClick = function () {
            };

            self.registerEvents = function () {
                window.addEventListener("message", function (event) {
                    console.log("received: " + event.data);

                    // can message back using event.source.postMessage(...)
                });
            };

            self.init();
        };

        return messageService;
    });