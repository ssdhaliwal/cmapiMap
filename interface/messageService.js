define(["interface/cmapiAdapter", "plugins/ViewUtilities"],
    function (cmapiAdapter, ViewUtilities) {

        let messageService = function (global) {
            let self = this;
            let map = global.plugins.extMap.map;
            self.cmapiAdapter = new cmapiAdapter(global);

            self.init = function () {
                self.registerEvents();
            };

            self.handleClick = function () {
            };

            self.registerEvents = function () {
                window.addEventListener("message", function (event) {
                    let data = ViewUtilities.tryJSONParse(event.data);
                    console.log(data);

                    if (data.hasOwnProperty("channel") && data.hasOwnProperty("payload")) {
                        let payload = ViewUtilities.tryJSONParse(data.payload);

                        switch (data.channel) {
                            // 1. map.overlay.*
                            case "map.overlay.create":
                                self.cmapiAdapter.onMapOverlayCreate(payload);
                                break;
                            case "map.overlay.remove":
                                self.cmapiAdapter.onMapOverlayRemove(payload);
                                break;
                            // 2. map.feature.*
                            case "map.feature.plot.url":
                                self.cmapiAdapter.onMapFeaturePlotUrl(payload);
                                break;
                        }
                    }

                    // send message back using event.source.postMessage(...)
                });

                window.GlobalNotify = function (channel, payload) {
                    // payload.mapId = window.cmwapiMapId;
                    // OWF.Eventing.publish(channel, JSON.stringify(payload));
                    window.parent.postMessage(JSON.stringify({ channel: channel, payload: ViewUtilities.fromHex(payload) }), "*");
                };
            };

            self.sendMessage = function (message) {
                // send message back using event.source.postMessage(...)
                // or window.top.postMessage('hello', '*')
                // or window.parent.postMessage("Hello From IFrame", "*");
                window.parent.postMessage(JSON.stringify(message), "*");
            }

            self.init();
        };

        return messageService;
    });