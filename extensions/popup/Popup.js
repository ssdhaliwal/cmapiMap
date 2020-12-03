define(["esri/dijit/Popup", "esri/symbols/SimpleFillSymbol", "esri/Color", "dojo/dom-class", "dojo/dom-construct"],
    function (esriPopup, SimpleFillSymbol, Color, domClass, domConstruct) {

        let extPopup = function(global) {
            let self = this;
            let map = null; // global.extensions.extMap.map;
            self.fillSymbol = new SimpleFillSymbol("solid", null, new Color("#A4CE67"));;
            self.popup = null;

            self.init = function() {
                self.popup = new esriPopup({
                  fillSymbol: self.fillSymbol,
                  titleInBody: false
                },
                  domConstruct.create("div")
                );
            };

            self.handleClick = function() {
            };
        };

        return extPopup;
    });