define(["interface/cmapiAdapter", "plugins/ViewUtilities", "plugins/JSUtilities"],
    function (cmapiAdapter, ViewUtilities, JSUtilities) {

        let messageService = function (globals) {
            let self = this;
            self.cmapiAdapter = new cmapiAdapter(globals);

            self.init = function () {
                console.log("messageService - init");
                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("messageService - handleClick");
            };

            self.registerEvents = function () {
                console.log("messageService - registerEvents");
                window.addEventListener("message", function ($event) {
                    console.log("messageService - registerEvents/message", $event);
                    let data = JSUtilities.tryJSONParse($event.data);
                    console.log(data);

                    if (data.hasOwnProperty("channel") && data.hasOwnProperty("payload")) {
                        let payload = JSUtilities.tryJSONParse(data.payload);
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

                            case "map.feature.remove":
                                self.cmapiAdapter.onMapOverlayRemove(payload);
                                break;

                            case "map.feature.hide":
                                self.cmapiAdapter.onMapOverlayHide(payload);
                                break;

                            case "map.feature.show":
                                self.cmapiAdapter.onMapOverlayShow(payload);
                                break;
            
                            // 3. map.view.*
                            case "map.view.zoom":
                                self.cmapiAdapter.onMapViewZoom(payload);
                                break;
                            case "map.view.center.overlay":
                                self.cmapiAdapter.onMapCenterOverlay(payload);
                                break;
                            case "map.view.center.feature":
                                self.cmapiAdapter.onMapCenterFeature(payload);
                                break;
                            case "map.view.center.location":
                                self.cmapiAdapter.onMapCenterLocation(payload);
                                break;
                            case "map.view.center.bounds":
                                self.cmapiAdapter.onMapCenterBounds(payload);
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
                    console.log("messageService - registerEvents/GlobalNotify");
                    // payload.mapId = window.cmwapiMapId;
                    // OWF.Eventing.publish(channel, JSON.stringify(payload));
                    window.parent.postMessage(JSON.stringify({ channel: channel, payload: JSUtilities.hex2Str(payload) }), "*");
                };
            };

            self.sendMessage = function (channel, message) {
                console.log("messageService - sendMessage");
                // send message back using event.source.postMessage(...)
                // or window.top.postMessage('hello', '*')
                // or window.parent.postMessage("Hello From IFrame", "*");
                window.parent.postMessage(JSON.stringify({ channel: channel, payload: message }), "*");
            }

            self.init();
        };

        return messageService;
    });