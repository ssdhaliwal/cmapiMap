define(["interface/cmapiAdapter", "plugins/ViewUtilities", "plugins/JSUtilities"],
    function (cmapiAdapter, ViewUtilities, JSUtilities) {

        let messageService = function (globals) {
            let self = this;
            self.cmapiAdapter = new cmapiAdapter(globals);

            self.init = function () {
                // console.log("messageService - init");
                self.registerEvents();
            };

            self.registerEvents = function () {
                // console.log("messageService - registerEvents");
                window.addEventListener("message", function ($event) {
                    // console.log("messageService - registerEvents/message", $event);
                    let data = JSUtilities.tryJSONParse($event.data);
                    // console.log(data);

                    if (data.hasOwnProperty("channel") && data.hasOwnProperty("payload")) {
                        let payload = JSUtilities.tryJSONParse(data.payload);
                        // console.log(payload);

                        switch (data.channel) {
                            // 1. map.overlay.*
                            case "map.overlay.create":
                                self.cmapiAdapter.onMapOverlayCreate(payload);
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
                                self.cmapiAdapter.onMapOverlayUpdate(payload);
                                break;
                            case "map.overlay.cluster.set":
                            case "map.overlay.cluster.remove":
                            case "map.overlay.cluster.activate":
                            case "map.overlay.cluster.deactivate":
                                break;

                            // 2. map.feature.*
                            case "map.feature.plot":
                                self.cmapiAdapter.onMapFeaturePlot(payload);
                                break;

                            case "map.feature.plot.batch":
                                break;

                            case "map.feature.plot.url":
                                self.cmapiAdapter.onMapFeaturePlotUrl(payload);
                                break;

                            case "map.feature.unplot":
                                self.cmapiAdapter.onMapOverlayRemove(payload);
                                break;

                            case "map.feature.unplot.batch":
                                break;

                            case "map.feature.hide":
                                self.cmapiAdapter.onMapOverlayHide(payload);
                                break;

                            case "map.feature.show":
                                self.cmapiAdapter.onMapOverlayShow(payload);
                                break;

                            case "map.feature.selected":
                            case "map.feature.selected.batch":
                            case "map.feature.deselected":
                            case "map.feature.deselected.batch":
                                break;

                            case "map.feature.update":
                            case "map.feature.edit":
                            case "map.feature.draw":
                                break;

                            case "map.feature.clicked":
                            case "map.feature.mousedown":
                            case "map.feature.mouseup":
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
                            case "map.view.mousedown":
                            case "map.view.mouseup":
                            case "map.view.area.selected":
                                break;

                            // 4. map.status.*
                            case "map.status.request":
                                self.cmapiAdapter.onMapStatusRequest(payload);
                                break;

                            case "map.status.view":
                                self.cmapiAdapter.onMapStatusRequest({ "types": ["view"] });
                                break;

                            case "map.status.format":
                                self.cmapiAdapter.onMapStatusRequest({ "types": ["format"] });
                                break;

                            case "map.status.about":
                                self.cmapiAdapter.onMapStatusRequest({ "types": ["about"] });
                                break;

                            case "map.status.selected":
                                self.cmapiAdapter.onMapStatusRequest({ "types": ["selected"] });
                                break;

                            case "map.status.initialization":
                                break;

                            // 5. map.message.*
                        }
                    }

                    // send message back using event.source.postMessage(...)
                });

                window.GlobalNotify = function (channel, payload) {
                    // console.log("messageService - registerEvents/GlobalNotify");
                    // payload.mapId = window.cmwapiMapId;
                    // OWF.Eventing.publish(channel, JSON.stringify(payload));
                    window.parent.postMessage(JSON.stringify({ channel: channel, payload: JSUtilities.hex2Str(payload) }), "*");
                };
            };

            self.sendMessage = function (channel, message) {
                // console.log("messageService - sendMessage");
                // send message back using event.source.postMessage(...)
                // or window.top.postMessage('hello', '*')
                // or window.parent.postMessage("Hello From IFrame", "*");
                window.parent.postMessage(JSON.stringify({ channel: channel, payload: message }), "*");
            }

            self.init();
        };

        return messageService;
    });