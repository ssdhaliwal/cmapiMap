define(["esri/dijit/Legend"],
    function (esriLegend) {

        let extLegend = function (global) {
            let self = this;
            let map = global.plugins.extMap.instance;
            self.layers = [];
            self.instance = null;

            self.init = function () {
                console.log("extLegend - init");
                self.instance = new esriLegend({
                    autoUpdate: true,
                    map: map,
                    respectCurrentMapScale: true,
                    layerInfos: self.layers
                }, "legendDiv");

                self.instance.startup();
                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("extLegend - handleClick");
                global.plugins.extToolbar.toggleOptions("#legend");

                if ($("#legend").hasClass("selected")) {
                    $("#infoPanel_wrapper").css("display", "block");
                }

                let container = dijit.byId("infoPanel_container");
                container.selectChild("legendPane", true);
            };

            self.registerEvents = function () {
                console.log("extLegend - registerEvents");
                // wireup map events
                map.on("layer-add-result", function ($event) {
                    console.log("extLegend - registerEvents/layer-add-result", $event);
                    if ($event.layer.declaredClass === "esri.layers.ArcGISTiledMapServiceLayer") {
                        // basemap - noop
                    } else if ($event.layer.declaredClass !== "esri.layers.KMLLayer") {
                        $event.layer._titleForLegend = $event.layer.id;
                        let layerInfo = { layer: $event.layer, name: $event.layer.id };
                        self.layers.push(layerInfo);

                        if (self.layers.length > 0) {
                            self.instance.refresh(self.layers);
                        }
                    } else {
                        //kml layer....
                        //dont display this as it has sublayers which will display making this a duplicate
                    }
                });

                //clean up the legend when layers are removed from the map.
                map.on('layer-remove', function ($event) {
                    console.log("extLegend - registerEvents/layer-remove", $event);
                    for (var i = 0; i < self.layers.length; i++) {
                        if (self.layers[i].name === $event.layer.id) {
                            self.layers.splice(i, 1);
                            self.instance.refresh(self.layers);
                            return;
                        }
                    }
                });

                //update the name of layers in the legend when the layer is updated or moved in the overlay manager
                map.on('layerUpdated', function ($event) {
                    console.log("extLegend - registerEvents/layerupdated", $event);
                    for (var i = 0; i < self.layers.length; i++) {
                        if (self.layers[i].name === $event.old_id) {
                            self.layers[i] = { name: $event.layer.id, layer: $event.layer }
                            self.instance.refresh(self.layers);
                            return;
                        }
                    }
                });

                $("#legend").on("click", function($event) {
                    console.log("extLegend - registerEvents/click", $event);
                    self.handleClick()
                });
            };

            self.init();
        };

        return extLegend;
    });