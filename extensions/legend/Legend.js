define(["esri/dijit/Legend"],
    function (esriLegend) {

        let extLegend = function (global) {
            let self = this;
            let map = global.map;
            let layers = [];
            let legend = null;

            self.init = function () {
                legend = new esriLegend({
                    autoUpdate: true,
                    map: map,
                    respectCurrentMapScale: true,
                    layerInfos: layers
                }, "legendDiv");

                legend.startup();

                // wireup map events
                map.on("layer-add-result", function (evt) {
                    if(evt.layer.declaredClass === "esri.layers.ArcGISTiledMapServiceLayer") {
                        // basemap - noop
                    } else if(evt.layer.declaredClass !== "esri.layers.KMLLayer"){
                        evt.layer._titleForLegend = evt.layer.id;
                        let layerInfo = {layer:evt.layer, name:evt.layer.id};
                        layers.push(layerInfo);
        
                        if (layers.length > 0) {
                            legend.refresh(layers);
                        }
                    } else {
                        //kml layer....
                        //dont display this as it has sublayers which will display making this a duplicate
                    }
                });
        
                //clean up the legend when layers are removed from the map.
                map.on('layer-remove', function(layer) {
                    for(var i = 0; i < layers.length; i++) {
                        if(layers[i].name === layer.layer.id) {
                            layers.splice(i, 1);
                            legend.refresh(layers);
                            return;
                        }
                    }
                });
        
                //update the name of layers in the legend when the layer is updated or moved in the overlay manager
                map.on('layerUpdated', function(data) {
                    for(var i = 0; i < layers.length; i++) {
                        if(layers[i].name === data.old_id) {
                            layers[i] = {name: data.layer.id, layer: data.layer}
                            legend.refresh(layers);
                            return;
                        }
                    }
                });        
            };

            self.handleClick = function () {
                $("#legend").toggleClass("selected");

                if ($("#infoPanel_wrapper").css("display") === "block") {
                    $("#infoPanel_wrapper").css("display", "none");
                } else {
                    $("#infoPanel_wrapper").css("display", "block");
                }

                let container = dijit.byId("infoPanel_container");
                container.selectChild("legendPane", true);
            };
        };

        return extLegend;
    });