define(["esri/layers/FeatureLayer", "esri/layers/LabelClass",
    "esri/renderers/ClassBreaksRenderer", "esri/renderers/SimpleRenderer", "esri/renderers/UniqueValueRenderer",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/TextSymbol",
    "plugins/ViewUtilities"],
    function (FeatureLayer, LabelClass,
        ClassBreaksRenderer, SimpleRenderer, UniqueValueRenderer,
        SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, TextSymbol,
        ViewUtilities) {

        let esriFeatureService = function (map, search, notify, service) {
            let self = this;
            self.map = map;
            self.search = search;
            self.notify = notify;
            self.service = service;
            self.layer = null;

            self.init = function () {
                console.log("... creating layer: " + self.service.text);
                let params = self.service.layer.params || {};
                if (!params.hasOwnProperty("mode")) {
                    params.mode = FeatureLayer.MODE_ONDEMAND;
                } else {
                    if (params.mode === "snapshot") {
                        params.mode = FeatureLayer.MODE_SNAPSHOT;
                    } else if (params.mode === "ondemand") {
                        params.mode = FeatureLayer.MODE_ONDEMAND;
                    } else if (params.mode === "selection") {
                        params.mode = FeatureLayer.MODE_SELECTION;
                    } else if (params.mode === "auto") {
                        params.mode = FeatureLayer.MODE_AUTO;
                    }
                }
                if (!params.hasOwnProperty("outFields")) {
                    params.outFields = ['*'];
                }

                let properties = self.service.layer.properties || {};
                self.layer = new FeatureLayer(properties.url, params);

                //Handle additional parameters
                //if (params.autoGeneralize) {
                //	self.layer.setAutoGeneralize(params.autoGeneralize);
                //}
                //if (params.definitionExpression) {
                //	self.layer.setDefinitionExpression(params.definitionExpression);
                //}
                if (params.editable) {
                    self.layer.setEditable(params.editable);
                }
                //if (params.featureReduction) {
                //	self.layer.setFeatureReduction(params.featureReduction);
                //}
                //if (params.infoTemplate) {
                //	self.layer.setInfoTemplates(params.infoTemplate);
                //}
                if (params.labelingInfo) {
                    self.layer.setLabelingInfo(params.labelingInfo);
                }
                if (params.maxAllowableOffset) {
                    self.layer.setMaxAllowableOffset(params.maxAllowableOffset);
                }
                if (params.maxScale) {
                    self.layer.setMaxScale(params.maxScale);
                }
                if (params.minScale) {
                    self.layer.setMinScale(params.minScale);
                }
                //if (params.opacity) {
                //	self.layer.setOpacity(params.opacity);
                //}
                //if (params.refreshInterval) {
                //	self.layer.RefreshInterval(params.refreshInterval);
                //}
                if (params.renderer) {
                    // only json constructors supported
                    var renderer = null;
                    switch (params.rendererType) {
                        case "classBreaks":
                            renderer = new ClassBreaksRenderer(params.renderer);
                            break;
                        case "simple":
                            renderer = new SimpleRenderer(params.renderer);
                            break;
                        case "uniqueValue":
                            renderer = new UniqueValueRenderer(params.renderer)
                            break;
                    }

                    if (renderer !== null) {
                        self.layer.setRenderer(renderer);
                    }
                }
                if (params.scaleRange) {
                    self.layer.setScaleRange(params.scaleRange.minScale, params.scaleRange.maxRange);
                }
                if (params.selectionSymbol) {
                    var symbol = null;
                    switch (params.selectionSymbolType) {
                        case "Point":
                            symbol = new SimpleMarkerSymbol(params.selectionSymbol);
                            break;
                        case "Line":
                            new SimpleLineSymbol(params.selectionSymbol);
                            break;
                        case "Polygon":
                            new SimpleFillSymbol(params.selectionSymbol);
                            break;
                    }

                    if (symbol !== null) {
                        self.layer.setSelectionSymbol(symbol);
                    }
                }

                if (params.showLabels && (params.showLabels === true || params.showLabels === "true")) {
                    var lblSymbol = null, lblClass = null;

                    if (params.lblClass) {
                        lblClass = new LabelClass(params.lblClass);

                        if (params.labelSymbol) {
                            lblSymbol = new TextSymbol(params.labelSymbol);
                        }

                        lblClass.symbol = lblSymbol;
                        layer.setLabelingInfo([lblClass]);
                        self.layer.setShowLabels(params.showLabels);
                    }
                }

                if (params.timeDimension) {
                    self.layer.setTimeDimension(params.timeDimension);
                }
                if (params.timeOffset) {
                    self.layer.setTimeOffset(params.timeOffset.offsetValue, params.timeOffset.offsetUnits);
                }
                //if (params.useMapTime) {
                //	self.layer.setUseMapTime(params.useMapTime);
                //}
                //if (params.WebGLEnabled) {
                //	self.layer.setWebGLEnabled(params.WebGLEnabled);
                //}
            };

            self.remove = function () {
                console.log("... removed layer: " + self.service.text);
                if (self.layer.hasOwnProperty("searchOptions")) {
                    self.search.removeSource(self.layer.searchOptions);
                }
                self.map.removeLayer(self.layer);
            };

            self.init();
        };

        return esriFeatureService;
    });