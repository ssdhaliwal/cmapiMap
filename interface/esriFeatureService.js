define(["esri/layers/FeatureLayer", "esri/layers/GraphicsLayer",
    "esri/layers/LabelClass", "esri/graphic", "esri/geometry/Point", "esri/geometry/Circle", "esri/geometry/Polygon",
    "esri/renderers/ClassBreaksRenderer", "esri/renderers/SimpleRenderer", "esri/renderers/UniqueValueRenderer",
    "dojo/_base/Color", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/TextSymbol",
    "esri/graphicsUtils", "plugins/ViewUtilities"],
    function (FeatureLayer, GraphicsLayer,
        LabelClass, graphic, Point, Circle, Polygon,
        ClassBreaksRenderer, SimpleRenderer, UniqueValueRenderer,
        Color, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol,
        TextSymbol,
        graphicsUtils, ViewUtilities) {

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

                // added for query/selection
                if (params.hasOwnProperty("_querySelect")) {
                    // create graphic layer for adding
                    var bufferLayer = new GraphicsLayer({
                        id: featureId + "_buffer"
                    });

                    params._querySelect.graphic = [];
                    params._querySelect.filters.forEach(filter => {
                        var graphic = null;
                        if (filter.type === "buffer") {
                            filter.geometry.forEach(marker => {
                                var point = new Point(marker.x, marker.y,
                                    new SpatialReference({
                                        wkid: filter.wkid || 4326
                                    }));

                                if (filter.hasOwnProperty("range")) {
                                    if (!filter.range.hasOwnProperty("1") && !filter.range.hasOwnProperty("2")) {
                                        var buffer = new Circle({
                                            center: point,
                                            geodesic: filter.geodesic || true,
                                            radius: filter.range,
                                            radiusUnit: filter.measureUnit || "esriMiles"
                                        });

                                        graphic = new Graphic(buffer, new SimpleFillSymbol(
                                            SimpleFillSymbol.STYLE_NULL,
                                            new SimpleLineSymbol(
                                                SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                                                new Color([105, 105, 105]), 2),
                                            new Color([255, 255, 0, 0.25])
                                        ));

                                        params["_querySelect"].graphic.push(buffer);
                                        bufferLayer.add(graphic);
                                    } else {
                                        if (filter.range.hasOwnProperty("1")) {
                                            var buffer = new Circle({
                                                center: point,
                                                geodesic: filter.geodesic || true,
                                                radius: filter.range["1"],
                                                radiusUnit: filter.measureUnit || "esriMiles"
                                            });

                                            graphic = new Graphic(buffer, new SimpleFillSymbol(
                                                SimpleFillSymbol.STYLE_SOLID,
                                                new SimpleLineSymbol(
                                                    SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                                                    new Color([105, 105, 105]),
                                                    2
                                                ), new Color([255, 255, 0, 0.25])
                                            ));

                                            params["_querySelect"].graphic.push(buffer);
                                            bufferLayer.add(graphic);
                                        }

                                        if (filter.range.hasOwnProperty("2")) {
                                            var buffer = new Circle({
                                                center: point,
                                                geodesic: filter.geodesic || true,
                                                radius: filter.range["2"],
                                                radiusUnit: filter.measureUnit || "esriMiles"
                                            });

                                            graphic = new Graphic(buffer, new SimpleFillSymbol(
                                                SimpleFillSymbol.STYLE_NULL,
                                                new SimpleLineSymbol(
                                                    SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                                                    new Color([105, 105, 105]),
                                                    2
                                                ), new Color([255, 255, 0, 0.25])
                                            ));

                                            params["_querySelect"].graphic.push(buffer);
                                            bufferLayer.add(graphic);
                                        }
                                    }
                                } else {
                                    var buffer = new Circle({
                                        center: point,
                                        geodesic: filter.geodesic || true,
                                        radius: 20,
                                        radiusUnit: filter.measureUnit || "esriMiles"
                                    });

                                    graphic = new Graphic(buffer, new SimpleFillSymbol(
                                        SimpleFillSymbol.STYLE_SOLID,
                                        new SimpleLineSymbol(
                                            SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                                            new Color([105, 105, 105]),
                                            2
                                        ), new Color([255, 255, 0, 0.25])
                                    ));

                                    params["_querySelect"].graphic.push(buffer);
                                    bufferLayer.add(graphic);
                                }
                            });

                            //bufferLayer.setOpacity(1.0);
                        }
                        if (filter.type === "area") {
                            filter.geometry.forEach(ring => {
                                var buffer = new Polygon({
                                    "rings": ring.rings,
                                    "spatialReference": { "wkid": filter.wkid || 4326 }
                                });

                                graphic = new Graphic(buffer, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                                        new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25])
                                ));

                                params["_querySelect"].graphic.push(buffer);
                                bufferLayer.add(graphic);
                            })
                        }
                    });

                    self.layer.bufferLayer = bufferLayer;
                    map.addLayers([bufferLayer]);

                    //  self.layer.layer.setMinScale(9244648.868618);
                    //  self.layer.layer.bufferLayer.setMinScale(9244648.868618);

                    // get extent of all graphics for query limitation
                    var layerExtent = graphicsUtils.graphicsExtent(bufferLayer.graphics);
                    params.definitionExpression = params.definitionExpression || {};
                    params.definitionExpression.geometry = layerExtent;
                    params.definitionExpression.geometryType = "esriGeometryPolygon";
                    params.definitionExpression.spatialRel = "esriSpatialRelIntersects";
                }

                self.map.addLayers([self.layer]);

                self.registerEvents();
            };

            self.registerEvents = function () {
                // syncSearchOptions();
            };

            self.remove = function () {
                console.log("... removed layer: " + self.service.text);
                if (self.layer.hasOwnProperty("searchOptions")) {
                    self.search.removeSource(self.layer.searchOptions);
                }
                self.map.removeLayer(self.layer);
            };

            // layer specific functions
            self.registerSearch = function () {

            };

            self.deregisterSearch = function () {

            }

            self.init();
        };

        return esriFeatureService;
    });