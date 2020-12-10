define(["esri/dijit/Legend"],
    function (esriLegend) {

        let extLegend = function (global) {
            let self = this;
            let map = global.plugins.extMap.map;
            self.layers = [];
            self.legend = null;

            self.init = function () {
                self.legend = new esriLegend({
                    autoUpdate: true,
                    map: map,
                    respectCurrentMapScale: true,
                    layerInfos: self.layers
                }, "legendDiv");

                self.legend.startup();
                self.registerEvents();
            };

            self.handleClick = function () {
                global.plugins.extToolbar.toggleOptions("#legend");

                if ($("#legend").hasClass("selected")) {
                    $("#infoPanel_wrapper").css("display", "block");
                }

                let container = dijit.byId("infoPanel_container");
                container.selectChild("legendPane", true);
            };

            self.registerEvents = function () {
                // wireup map events
                map.on("layer-add-result", function (evt) {
                    if (evt.layer.declaredClass === "esri.layers.ArcGISTiledMapServiceLayer") {
                        // basemap - noop
                    } else if (evt.layer.declaredClass !== "esri.layers.KMLLayer") {
                        evt.layer._titleForLegend = evt.layer.id;
                        let layerInfo = { layer: evt.layer, name: evt.layer.id };
                        self.layers.push(layerInfo);

                        if (self.layers.length > 0) {
                            self.legend.refresh(self.layers);
                        }
                    } else {
                        //kml layer....
                        //dont display this as it has sublayers which will display making this a duplicate
                    }
                });

                //clean up the legend when layers are removed from the map.
                map.on('layer-remove', function (layer) {
                    for (var i = 0; i < self.layers.length; i++) {
                        if (self.layers[i].name === layer.layer.id) {
                            self.layers.splice(i, 1);
                            self.legend.refresh(self.layers);
                            return;
                        }
                    }
                });

                //update the name of layers in the legend when the layer is updated or moved in the overlay manager
                map.on('layerUpdated', function (data) {
                    for (var i = 0; i < self.layers.length; i++) {
                        if (self.layers[i].name === data.old_id) {
                            self.layers[i] = { name: data.layer.id, layer: data.layer }
                            self.legend.refresh(self.layers);
                            return;
                        }
                    }
                });

                $("#legend").on("click", self.handleClick);
            };

            self.init();
        };

        return extLegend;
    });