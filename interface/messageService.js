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
                    // send message back using event.source.postMessage(...)
                });
            };

            self.sendMessage = function(message) {
                // send message back using event.source.postMessage(...)
                // or window.top.postMessage('hello', '*')
                // or window.parent.postMessage("Hello From IFrame", "*");
                window.parent.postMessage(JSON.stringify(message), "*");
            }

            self.init();
        };

        return messageService;
    });