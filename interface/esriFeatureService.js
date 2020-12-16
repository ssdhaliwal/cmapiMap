define(["esri/layers/FeatureLayer", "esri/layers/GraphicsLayer",
    "esri/layers/LabelClass", "esri/graphic", "esri/geometry/Point", "esri/geometry/Circle", "esri/geometry/Polygon",
    "esri/renderers/ClassBreaksRenderer", "esri/renderers/SimpleRenderer", "esri/renderers/UniqueValueRenderer",
    "dojo/_base/Color", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/TextSymbol",
    "esri/InfoTemplate", "esri/dijit/PopupTemplate",
    "esri/tasks/query", "dojo/_base/array", "dojo/dom-construct",
    "esri/graphicsUtils", "plugins/ViewUtilities"],
    function (FeatureLayer, GraphicsLayer,
        LabelClass, graphic, Point, Circle, Polygon,
        ClassBreaksRenderer, SimpleRenderer, UniqueValueRenderer,
        Color, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol,
        TextSymbol,
        InfoTemplate, PopupTemplate,
        Query, array, domConstruct,
        graphicsUtils, ViewUtilities) {

        let esriFeatureService = function (global, service) {
            let self = this;
            self.map = global.plugins.extMap.map;
            self.search = global.plugins.extSearch;
            self.notify = global.plugins.extNotify;
            self.message = global.interfaces.messageService;
            self.service = service;
            self.layer = null;
            self.selectedFeatures = [];
            self.searchOptions = null;

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

                if (params.showLabels && ViewUtilities.getBoolean(params.showLabels)) {
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
                        id: self.service.id + "_buffer"
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
                self.registerSearch();
            };

            self.registerEvents = function () {
                let params = self.service.layer.params || {};

                // syncSearchOptions();

                /*
                layer.on("visibility-change", (visibility) => {
                    console.log("visibility-change", visibility);
                });
                */
                self.layer.on("graphic-add", (feature) => {
                    if (params.hasOwnProperty("_querySelect")) {
                        let qsLen = params._querySelect.graphic.length;
                        let found = false;
                        for (let i = 0; i < qsLen; i++) {
                            if (params._querySelect.graphic[i].contains(feature.graphic.geometry)) {
                                i = qsLen;
                                found = true;
                            }
                        }
                        if (!found) {
                            feature.graphic.hide();
                        }
                    }
                });

                /*
                self.layer.on("graphic-draw", function ($event) {
                    console.log("graphic-draw", $event);
                });
                self.layer.on("query-count-complete", function ($event) {
                    console.log("query-count-complete", $event);
                });
                self.layer.on("query-extent-complete", function ($event) {
                    console.log("query-extent-complete", $event);
                });
                self.layer.on("query-ids-complete", function ($event) {
                    console.log("query-ids-complete", $event);
                });
                self.layer.on("query-features-complete", function ($event) {
                    console.log("query-features-complete", $event);
                });

                self.layer.on("refresh-tick", function ($event) {
                    if (params.hasOwnProperty("_querySelect")) {
                        var tmpGraphicsLayer = new GraphicsLayer({
                            id: "tmp_" + self.layer.id
                        });
                        let tGraphic;
                        self.layer.graphics.forEach((graphic) => {
                            if (graphic.visible === true) {
                                tGraphic = new Graphic(graphic.toJson());
                                tGraphic.symbol = layer.renderer.symbol.toJson();
                                tGraphic.visible = true;
                                tmpGraphicsLayer.graphics.push(tGraphic);
                            }
                        });
                        if (tmpGraphicsLayer.graphics.length > 0) {
                            map.addLayer(tmpGraphicsLayer);
                            self.layer["tmpGraphicsLayer"] = tmpGraphicsLayer;
                        }
                    }
                });

                self.layer.on("update-end", function ($event) {
                    if (params.hasOwnProperty("_querySelect")) {
                        if (self.layer.hasOwnProperty("tmpGraphicsLayer")) {
                            map.removeLayer(self.layer.tmpGraphicsLayer);
                            delete self.layer["tmpGraphicsLayer"];
                        }
                    }
                });
                */

                self.layer.on("load", function ($event) {
                    // set font color if needed
                    if ($event.layer.hasOwnProperty("labelingInfo")) {
                        if ($event.layer.labelingInfo.length > 0) {
                            $event.layer.labelingInfo.forEach(label => {
                                if (label.hasOwnProperty("symbol")) {
                                    if (label.symbol.hasOwnProperty("color")) {
                                        label.symbol.color = new Color(map.basemapFontColor);
                                        delete label.symbol.haloColor;
                                        delete label.symbol.haloSize;
                                    }
                                }
                            });
                        }
                    }

                    // adjust for infoTemplate
                    if ((!params.infoTemplateClass) ||
                        (params.infoTemplateClass.type === "default")) {
                        let fieldInfos = array.map(self.layer.fields, function (field) {
                            let showField =
                                (params.outFields[0] === "*") ||
                                (params.outFields.indexOf(field.name) >= 0) || false;
                            return {
                                "fieldName": field.name,
                                "label": field.alias,
                                "visible": showField
                            }
                        });

                        let template = new PopupTemplate({
                            title: "Attributes",
                            fieldInfos: fieldInfos,
                        });
                        self.layer.setInfoTemplate(template);
                    } else if (params.infoTemplateClass) {
                        if (params.infoTemplateClass.type === "standard") {
                            if (params.infoTemplateClass.standard) {
                                let template = new InfoTemplate();
                                template.setTitle(params.infoTemplateClass.standard.title);
                                let description = (params.infoTemplateClass.standard.description ? (params.infoTemplateClass.standard.description + "<hr>") : "");
                                if (params.infoTemplateClass.standard.showAttributes &&
                                    ViewUtilities.getBoolean(params.infoTemplateClass.standard.showAttributes)) {
                                    description +=
                                        "<div class=\"esriViewPopup\"><div class=\"mainSection\"><table class=\"attrTable\" cellpadding=\"2px\" cellspacing=\"0px\"> " +
                                        "<tbody> ";
                                    self.layer.fields.forEach(function (field) {
                                        if ((params.outFields[0] === "*") ||
                                            (params.outFields.indexOf(field.name) >= 0) || false) {
                                            description += "	<tr valign=\"top\"><td class=\"attrName\">" + field.name + "</td><td class=\"attrValue\">${" + field.name + "}</td></tr> ";
                                        }
                                    });
                                    description +=
                                        "</tbody> " +
                                        "</table></div></div>";
                                }

                                if (params.infoTemplateClass.standard.commandSet &&
                                    params.infoTemplateClass.standard.commandSet.title &&
                                    params.infoTemplateClass.standard.commandSet.channel &&
                                    params.infoTemplateClass.standard.commandSet.fields &&
                                    params.infoTemplateClass.standard.commandSet.actions) {
                                    description += "<hr>" +
                                        (params.infoTemplateClass.standard.commandSet.title || "") + " - ";
                                    let actionData = "";
                                    params.infoTemplateClass.standard.commandSet.fields.forEach(function (field) {
                                        let alias = field.split(";");
                                        if (alias.length > 1) {
                                            actionData += "\"" + alias[1] + "\":\"${" + alias[0] + "}\","
                                        } else {
                                            actionData += "\"" + field + "\":\"${" + field + "}\","
                                        }
                                    });
                                    
                                    if (params.infoTemplateClass.standard.commandSet.staticFields) {
                                        actionData += "staticFields:" + JSON.stringify(params.infoTemplateClass.standard.commandSet.staticFields);
                                    }
                                    params.infoTemplateClass.standard.commandSet.actions.forEach(function (action) {
                                        description += "<a style='padding-right: 5px;' href='javascript:window.GlobalNotify(\"" +
                                            params.infoTemplateClass.standard.commandSet.channel + "\", {" +
                                            "\"" + action.name + "\":\"" + action.value + "\"," + actionData + "});'>" + action.name + "</a>";
                                    });
                                }

                                template.setContent(description);
                                self.layer.setInfoTemplate(template);
                            }
                        } else if (params.infoTemplateClass.type === "reference") {
                            if (params.infoTemplateClass.reference) {
                                let template = new InfoTemplate();
                                template.setTitle(params.infoTemplateClass.reference.title);

                                self.layer.infoTemplateClass = {};
                                self.layer.infoTemplateClass.reference = params.infoTemplateClass.reference;
                                self.layer.infoTemplateClass.reference.overlayId = self.service.overlayId;
                                self.layer.infoTemplateClass.reference.featureId = self.service.id;

                                template.setContent(getLayerUrlInfoTemplate);
                                self.layer.setInfoTemplate(template);
                            }
                        }
                    }

                    if (ViewUtilities.getBoolean(params.zoom)) {
                        ViewUtilities.zoomToLayer(self.map, self.layer);
                    }
                });

                let selectQuery = new Query();
                self.layer.on('click', function (e) {

                    // update popup dynamically
                    let gLayer = e.graphic.getLayer();
                    if (e.ctrlKey === true) {
                        let template = new esri.InfoTemplate();
                        // Flag icons are from http://twitter.com/thefella, released under creative commons.
                        template.setTitle("<b>${NAME}</b>");
                        template.setContent(self.getLayerControlInfoTemplate);
                        gLayer.setInfoTemplate(template);

                        return false;
                    }

                    // click actions
                    self.selectedFeatures = [];
                    self.selectedFeatures.push({
                        deselectedId: e.graphic.getLayer().id,
                        deselectedName: e.graphic.getLayer().name
                    });

                    self.message.sendMessage(JSON.stringify({
                        message: "map.feature.clicked",
                        payload: {
                            overlayId: self.service.overlayId,
                            featureId: self.service.id,
                            lat: e.mapPoint.y,
                            lon: e.mapPoint.x,
                            button: "left",
                            type: "single",
                            keys: []
                        }
                    }));

                    self.message.sendMessage(JSON.stringify({
                        message: "map.status.selected",
                        payload: {
                            overlayId: self.service.overlayId,
                            selectedFeatures: [{
                                featureId: self.service.id,
                                selectedId: e.graphic.attributes.id
                            }]
                        }
                    }));

                    if (e.graphic.geometry.type === "point") {
                        selectQuery.geometry = ViewUtils.pointToExtent(map, e.graphic.geometry, 10);
                    } else {
                        selectQuery.geometry = e.graphic.geometry;
                    }

                    self.layer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW, function (features) {
                        if (features.length > 0) {
                            let featureItems = [];
                            let featureGeometry = {};
                            for (let fi = 0; fi < features.length; fi++) {
                                featureGeometry = JSON.parse(JSON.stringify(features[fi].geometry));
                                featureItems.push({
                                    attributes: features[fi].attributes,
                                    geometry: featureGeometry
                                });
                            }

                            self.message.sendMessage(JSON.stringify({
                                message: "map.feature.selected",
                                payload: {
                                    overlayId: self.service.overlayId,
                                    featureId: self.service.id,
                                    selectedId: e.graphic.getLayer().id,
                                    selectedName: e.graphic.getLayer().name,
                                    features: featureItems
                                }
                            }));
                        } else {
                            self.message.sendMessage(JSON.stringify({
                                message: "map.feature.selected",
                                payload: {
                                    overlayId: self.service.overlayId,
                                    featureId: self.service.id,
                                    selectedId: e.graphic.getLayer().id,
                                    selectedName: e.graphic.getLayer().name
                                }
                            }));
                        }
                    });
                });

                self.layer.on('mouse-down', function (e) {
                    self.message.sendMessage(JSON.stringify({
                        message: "map.feature.mousedown",
                        payload: {
                            overlayId: self.service.overlayId,
                            featureId: self.service.id,
                            lat: e.mapPoint.y,
                            lon: e.mapPoint.x,
                            button: "left",
                            type: "single",
                            keys: []
                        }
                    }));
                });

                self.layer.on('mouse-up', function (e) {
                    self.message.sendMessage(JSON.stringify({
                        message: "map.feature.mouseup",
                        payload: {
                            overlayId: self.service.overlayId,
                            featureId: self.service.id,
                            lat: e.mapPoint.y,
                            lon: e.mapPoint.x,
                            button: "left",
                            type: "single",
                            keys: []
                        }
                    }));
                });

                self.layer.on("error", function (e) {
                    /*
                    if (e.hasOwnProperty("error")) {
                        console.log(e.error);

                        if (e.error.hasOwnProperty("code")) {
                            if ((e.error.code >= 400) && (e.error.code < 600)) {
                                _layerErrorHandler(caller, overlayId, featureId, layer, e);
                            }
                        }
                    }
                    */
                });
            };

            self.remove = function () {
                console.log("... removed layer: " + self.service.text);
                if (self.layer.hasOwnProperty("searchOptions")) {
                    self.search.removeSource(self.layer.searchOptions);
                }
                self.map.removeLayer(self.layer);
                self.deregisterSearch();

                $.each(self.selectedFeatures, function (index, feature) {
                    self.message.sendMessage(JSON.stringify({
                        message: "map.feature.deselected",
                        payload: {
                            overlayId: self.service.overlayId,
                            featureId: self.service.id,
                            deSelectedId: feature.deselectedId,
                            deSelectedName: feature.deselectedName
                        }
                    }));
                });
                self.selectedFeatures = [];
            };

            // layer specific functions
            self.registerSearch = function () {
                let params = self.service.layer.params || {};

                if (params.hasOwnProperty("searchOptions")) {
                    self.searchOptions = {};
                    self.searchOptions.featureLayer = self.layer;
                    self.searchOptions.placeholder = params.searchOptions.placeholder;
                    self.searchOptions.enableLabel = params.searchOptions.enableLabel;
                    self.searchOptions.searchFields = params.searchOptions.searchFields;
                    self.searchOptions.displayField = params.searchOptions.displayField;
                    self.searchOptions.exactMatch = params.searchOptions.exactMatch;
                    self.searchOptions.maxResults = params.searchOptions.maxResults;
                    self.searchOptions.outFields = params.outFields;

                    self.search.addSource(self.searchOptions);
                }
            };

            self.deregisterSearch = function () {
                if (self.searchOptions !== null) {
                    self.search.removeSource(self.searchOptions);
                }
            }

            self.getLayerControlInfoTemplate = function (graphic) {
                // Display attribute information.
                let message = {
                    overlayId: self.service.overlayId,
                    featureId: self.service.id,
                    attributes: JSON.stringify(graphic.attributes)
                };

                let node = domConstruct.toDom("<div>I'm a Node {" + graphic.attributes.FID + "}<br>" +
                    "<a href='javascript:window.GlobalNotify(\"ctrl-message\",\"" + 
                        ViewUtilities.toHex(JSON.stringify(message)) + "\");'>click here</a></div>");
                return node;
            };

            self.init();
        };

        return esriFeatureService;
    });