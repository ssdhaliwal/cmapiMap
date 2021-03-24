define(["esri/layers/FeatureLayer", "esri/layers/GraphicsLayer",
    "esri/layers/LabelClass", "esri/graphic", "esri/geometry/Point", "esri/geometry/Circle", "esri/geometry/Polygon",
    "esri/renderers/ClassBreaksRenderer", "esri/renderers/SimpleRenderer", "esri/renderers/UniqueValueRenderer",
    "dojo/_base/Color", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/TextSymbol",
    "esri/InfoTemplate", "esri/dijit/PopupTemplate",
    "esri/tasks/query", "dojo/_base/array", "dojo/dom-construct",
    "esri/geometry/webMercatorUtils", "esri/graphicsUtils", "plugins/ViewUtilities", "plugins/JSUtilities"],
    function (FeatureLayer, GraphicsLayer,
        LabelClass, graphic, Point, Circle, Polygon,
        ClassBreaksRenderer, SimpleRenderer, UniqueValueRenderer,
        Color, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol,
        TextSymbol,
        InfoTemplate, PopupTemplate,
        Query, array, domConstruct,
        webMercatorUtils, graphicsUtils, ViewUtilities, JSUtilities) {

        let esriFeatureService = function (global, service) {
            let self = this;
            self.map = global.plugins.extMap.instance;
            self.search = global.plugins.extSearch;
            self.notify = global.plugins.extNotify;
            self.message = global.interfaces.messageService;
            self.datagrid = global.plugins.extDatagrid;
            self.service = service;
            self.layer = null;
            self.selectedFeatures = [];
            self.searchOptions = null;

            self.init = function () {
                console.log("esriFeatureService - init");
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
                    let renderer = null;
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
                    let symbol = null;
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

                if (params.showLabels && JSUtilities.getBoolean(params.showLabels)) {
                    let lblSymbol = null, lblClass = null;

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
                    let bufferLayer = new GraphicsLayer({
                        id: self.service.id + "_buffer"
                    });

                    params._querySelect.graphic = [];
                    params._querySelect.filters.forEach(filter => {
                        let graphic = null;
                        if (filter.type === "buffer") {
                            filter.geometry.forEach(marker => {
                                let point = new Point(marker.x, marker.y,
                                    new SpatialReference({
                                        wkid: filter.wkid || 4326
                                    }));

                                if (filter.hasOwnProperty("range")) {
                                    if (!filter.range.hasOwnProperty("1") && !filter.range.hasOwnProperty("2")) {
                                        let buffer = new Circle({
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
                                            let buffer = new Circle({
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
                                            let buffer = new Circle({
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
                                    let buffer = new Circle({
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
                                let buffer = new Polygon({
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
                    let layerExtent = graphicsUtils.graphicsExtent(bufferLayer.graphics);
                    params.definitionExpression = params.definitionExpression || {};
                    params.definitionExpression.geometry = layerExtent;
                    params.definitionExpression.geometryType = "esriGeometryPolygon";
                    params.definitionExpression.spatialRel = "esriSpatialRelIntersects";
                }

                if (params.definitionExpression) {
                    self.layer.setDefinitionExpression(params.definitionExpression);
                }

                self.map.addLayers([self.layer]);

                self.registerEvents();
                self.registerSearch();
            };

            self.registerEvents = function () {
                console.log("esriFeatureService - registerEvents");
                let params = self.service.layer.params || {};

                // syncSearchOptions();

                /*
                layer.on("visibility-change", (visibility) => {
                    console.log("esriFeatureService - registerEvents/visibility-change", visibility);
                });
                */
                self.layer.on("graphic-add", (feature) => {
                    // console.log("esriFeatureService - registerEvents/graphic-add", feature);
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
                    console.log("esriFeatureService - registerEvents/graphic-draw", $event);
                });
                self.layer.on("query-count-complete", function ($event) {
                    console.log("esriFeatureService - registerEvents/query-count-complete", $event);
                });
                self.layer.on("query-extent-complete", function ($event) {
                    console.log("esriFeatureService - registerEvents/query-extent-complete", $event);
                });
                self.layer.on("query-ids-complete", function ($event) {
                    console.log("esriFeatureService - registerEvents/query-ids-complete", $event);
                });
                self.layer.on("query-features-complete", function ($event) {
                    console.log("esriFeatureService - registerEvents/query-features-complete", $event);
                });

                self.layer.on("refresh-tick", function ($event) {
                    console.log("esriFeatureService - registerEvents/refresh-tick", $event);
                    if (params.hasOwnProperty("_querySelect")) {
                        let tmpGraphicsLayer = new GraphicsLayer({
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
                    console.log("esriFeatureService - registerEvents/update-end", $event);
                    if (params.hasOwnProperty("_querySelect")) {
                        if (self.layer.hasOwnProperty("tmpGraphicsLayer")) {
                            map.removeLayer(self.layer.tmpGraphicsLayer);
                            delete self.layer["tmpGraphicsLayer"];
                        }
                    }
                });
                */

                self.layer.on("load", function ($event) {
                    console.log("esriFeatureService - registerEvents/load", $event);
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
                                    JSUtilities.getBoolean(params.infoTemplateClass.standard.showAttributes)) {
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
                                self.layer.infoTemplateClass.reference.parentId = self.service.parentId;
                                self.layer.infoTemplateClass.reference.featureId = self.service.id;

                                template.setContent(getLayerUrlInfoTemplate);
                                self.layer.setInfoTemplate(template);
                            }
                        }
                    }

                    if (JSUtilities.getBoolean(params.zoom)) {
                        ViewUtilities.zoomToLayer(self.map, self.layer);
                    }
                });

                self.layer.on("update-end", function ($event) {
                    console.log("esriFeatureService - registerEvents/update-end", $event);
                    // add to grid via promise
                    new Promise(function (resolve, reject) {
                        resolve(self);
                    }).then(function (layer) {
                        self.datagrid.addTab(self);
                    });                    
                });

                let selectQuery = new Query();
                self.layer.on('click', function ($event) {
                    console.log("esriFeatureService - registerEvents/click", $event);

                    // update popup dynamically
                    let gLayer = $event.graphic.getLayer();
                    if ($event.ctrlKey === true) {
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
                        deselectedId: $event.graphic.getLayer().id,
                        deselectedName: $event.graphic.getLayer().name
                    });

                    self.message.sendMessage("map.feature.clicked",
                        JSON.stringify({
                            overlayId: self.service.parentId,
                            featureId: self.service.id,
                            lat: $event.mapPoint.y,
                            lon: $event.mapPoint.x,
                            button: "left",
                            type: "single",
                            keys: []
                        }));

                    self.message.sendMessage("map.status.selected",
                        JSON.stringify({
                            overlayId: self.service.parentId,
                            selectedFeatures: [{
                                featureId: self.service.id,
                                selectedId: $event.graphic.attributes.id
                            }]
                        }));

                    if ($event.graphic.geometry.type === "point") {
                        selectQuery.geometry = ViewUtilities.pointToExtent(self.map, $event.graphic.geometry, 10);
                    } else {
                        selectQuery.geometry = $event.graphic.geometry;
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

                            self.message.sendMessage("map.feature.selected",
                                JSON.stringify({
                                    overlayId: self.service.parentId,
                                    featureId: self.service.id,
                                    selectedId: $event.graphic.getLayer().id,
                                    selectedName: $event.graphic.getLayer().name,
                                    features: featureItems
                                }));
                        } else {
                            self.message.sendMessage("map.feature.selected",
                                JSON.stringify({
                                    overlayId: self.service.parentId,
                                    featureId: self.service.id,
                                    selectedId: $event.graphic.getLayer().id,
                                    selectedName: $event.graphic.getLayer().name
                                }));
                        }
                    });
                });

                self.layer.on('mouse-down', function ($event) {
                    console.log("esriFeatureService - registerEvents/mouse-down", $event);
                    self.message.sendMessage("map.feature.mousedown",
                        JSON.stringify({
                            overlayId: self.service.parentId,
                            featureId: self.service.id,
                            lat: $event.mapPoint.y,
                            lon: $event.mapPoint.x,
                            button: "left",
                            type: "single",
                            keys: []
                        }));
                });

                self.layer.on('mouse-up', function ($event) {
                    console.log("esriFeatureService - registerEvents/mouse-up", $event);
                    self.message.sendMessage("map.feature.mouseup",
                        JSON.stringify({
                            overlayId: self.service.parentId,
                            featureId: self.service.id,
                            lat: $event.mapPoint.y,
                            lon: $event.mapPoint.x,
                            button: "left",
                            type: "single",
                            keys: []
                        }));
                });

                self.layer.on("error", function ($event) {
                    console.log("esriFeatureService - registerEvents/error", $event);
                    /*
                    if ($event.hasOwnProperty("error")) {
                        console.log($event.error);

                        if ($event.error.hasOwnProperty("code")) {
                            if (($event.error.code >= 400) && ($event.error.code < 600)) {
                                _layerErrorHandler(caller, overlayId, featureId, layer, e);
                            }
                        }
                    }
                    */
                });
            };

            self.remove = function () {
                console.log("esriFeatureService - remove");
                console.log("... removed layer: " + self.service.text);
                if (self.layer.hasOwnProperty("searchOptions")) {
                    self.search.removeSource(self.layer.searchOptions);
                }
                self.deregisterSearch();

                self.datagrid.removeTab(self);

                self.map.removeLayer(self.layer);
                $.each(self.selectedFeatures, function (index, feature) {
                    self.message.sendMessage("map.feature.deselected",
                        JSON.stringify({
                            overlayId: self.service.parentId,
                            featureId: self.service.id,
                            deSelectedId: feature.deselectedId,
                            deSelectedName: feature.deselectedName
                        }));
                });
                self.selectedFeatures = [];
            };

            // layer specific functions
            self.registerSearch = function () {
                console.log("esriFeatureService - registerSearch");
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
                console.log("esriFeatureService - deregisterSearch");
                if (self.searchOptions !== null) {
                    self.search.removeSource(self.searchOptions);
                }
            }

            self.getLayerControlInfoTemplate = function (graphic) {
                console.log("esriFeatureService - getLayerControlInfoTemplate");
                // Display attribute information.
                let message = {
                    overlayId: self.service.parentId,
                    featureId: self.service.id,
                    attributes: JSON.stringify(graphic.attributes)
                };

                let node = domConstruct.toDom("<div>I'm a Node {" + graphic.attributes.FID + "}<br>" +
                    "<a href='javascript:window.GlobalNotify(\"ctrl-message\",\"" +
                    JSUtilities.toHex(JSON.stringify(message)) + "\");'>click here</a></div>");
                return node;
            };

            self.getData = function () {
                console.log("esriFeatureService - getData");

                // objectIdField, geometryType, graphics(attributes)
                console.log(self.layer, self.layer.objectIdField, self.layer.geometryType, self.layer.graphics);
                return new Promise(function (resolve, reject) {
                    let layerData = {};
                    layerData.identifier = self.layer.objectIdField;
                    layerData.items = [];
    
                    let point = null, mapPoint = null, item = {};
                    self.layer.graphics.forEach(graphic => {
                        item = {};
                        Object.assign(item, graphic.attributes);

                        if (graphic.geometry.hasOwnProperty("x")) {
                            mapPoint = new Point(graphic.geometry.x, graphic.geometry.x);
                        } else if (graphic.geometry.hasOwnProperty("paths")) {
                            mapPoint = graphic.geometry.getExtent().getCenter();
                        } else if (graphic.geometry.hasOwnProperty("rings")) {
                            mapPoint = graphic.geometry.getExtent().getCenter();
                        }
                        point = webMercatorUtils.webMercatorToGeographic(mapPoint);
                        item.latitude = point.y;
                        item.longitude = point.x;

                        item.type = graphic.geometry.type;
                        layerData.items.push(item);
                    });
    
                    resolve(layerData);
                });
            };

            self.centerOn = function (id) {
                console.log("esriFeatureService - centerOn");

            };

            self.init();
        };

        return esriFeatureService;
    });