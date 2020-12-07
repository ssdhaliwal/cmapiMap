define(["esri/dijit/LayerList"],
    function (LayerList) {

        let extLayerlist = function (global) {
            let self = this;
            let map = global.extensions.extMap.map;
            self.layerlist = null;
            self.layers = [];

            self.init = function () {
                self.layerlist = new LayerList({
                    map: map,
                    removeUnderscores: true,
                    showSubLayers: true,
                    showOpacitySlider: true,
                    layers: self.layers
                 },"layerlistDiv");

                 self.layerlist.startup();
                 self.registerEvents();
            };

            self.handleClick = function () {
                global.extensions.extToolbar.toggleOptions("#layerlist");

                if ($("#layerlist").hasClass("selected")) {
                    $("#layerlist_wrapper").css("display", "block");
                }
            };

            self.registerEvents = function () {
                $("#layerlist").on("click", self.handleClick);
            };

            self.addLayers = function(layers) {
                layers.forEach(element => {
                    console.log(element);
                    self.layers.push(element); 
                });

                console.log(layers, self.layers);
                self.layerlist.refresh();
            }
        };

        return extLayerlist;
    });