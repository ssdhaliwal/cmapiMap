define(["esri/dijit/Popup", "esri/symbols/SimpleFillSymbol", "esri/Color", "dojo/dom-class", "dojo/dom-construct"],
  function (esriPopup, SimpleFillSymbol, Color, domClass, domConstruct) {

    let extPopup = function (globals) {
      let self = this;
      self.fillSymbol = new SimpleFillSymbol("solid", null, new Color("#A4CE67"));;
      self.instance = null;

      self.init = function () {
        // console.log("extPopup - init");
        self.instance = new esriPopup({
          fillSymbol: self.fillSymbol,
          titleInBody: false
        },
          domConstruct.create("div")
        );

        self.registerEvents();
      };

      self.handleClick = function () {
        // console.log("extPopup - handleClick");
      };

      self.registerEvents = function () {
        // console.log("extPopup - registerEvents");
      };

      self.init();
    };

    return extPopup;
  });