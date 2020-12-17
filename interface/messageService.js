define(["interface/cmapiAdapter", "plugins/ViewUtilities"],
    function (cmapiAdapter, ViewUtilities) {

        let messageService = function (global) {
            let self = this;
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
                        console.log(payload);

                        switch (data.channel) {
                            // 1. map.overlay.*
                            case "map.overlay.create":
                                self.cmapiAdapter.onMapOverlayCreateUpdate(payload);
                                break;
                            case "map.overlay.remove":
                                self.cmapiAdapter.onMapOverlayRemove(payload);
                                break;
                            case "map.overlay.hide":
                                self.cmapiAdapter.onMapOverlayHide(payload);
                                break;
                            case "map.overlay.show":
                                self.cmapiAdapter.onMapOverlayShow(payload);
                                break;
                            case "map.overlay.update":
                                self.cmapiAdapter.onMapOverlayCreateUpdate(payload);
                                break;

                            // 2. map.feature.*
                            case "map.feature.plot.url":
                                self.cmapiAdapter.onMapFeaturePlotUrl(payload);
                                break;

                            // 3. map.view.*
                            case "map.view.zoom":
                                break;
                            case "map.center.overlay":
                                break;
                            case "map.center.feature":
                                break;
                            case "map.center.location":
                                break;
                            case "map.center.bounds":
                                break;
                            case "map.view.clicked":
                                break;
                            case "map.view.mousedown":
                                break;
                            case "map.view.mouseup":
                                break;
                            case "map.view.area.selected":
                                break;

                            // 4. map.status.*

                            // 5. map.message.*
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

            self.sendMessage = function (channel, message) {
                // send message back using event.source.postMessage(...)
                // or window.top.postMessage('hello', '*')
                // or window.parent.postMessage("Hello From IFrame", "*");
                window.parent.postMessage(JSON.stringify({ channel: channel, payload: message }), "*");
            }

            self.init();
        };

        return messageService;
    });