define(["esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/PictureFillSymbol", "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    "esri/graphic", "esri/SpatialReference", "esri/geometry/webMercatorUtils",
    "esri/geometry/Point", "esri/geometry/Polyline", "esri/geometry/Polygon",
    "esri/layers/GraphicsLayer", "esri/InfoTemplate",
    "esri/Color",
    "plugins/ViewUtilities", "plugins/JSUtilities", "milsymbol"],
    function (SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
        PictureMarkerSymbol, PictureFillSymbol, TextSymbol, Font,
        Graphic, SpatialReference, webMercatorUtils,
        Point, Polyline, Polygon, GraphicsLayer, InfoTemplate,
        Color,
        ViewUtilities, JSUtilities, mil2525) {

        let KML2GraphicsLayer = function (name, document, properties, params) {
            let self = this;
            self.document = document;
            self.properties = properties;
            self.params = params;

            self.kml = {
                name: name,
                count: 0
            };
            self.uniqueId = 0;

            self.init = function () {
                self.document = document;

                initializeDefaultStyles();
                parse(self.document);

                loadPlacemarks();
                loadOverlays();
                loadNetworkLinks();
            };

            initializeDefaultStyles = function () {
                self.defaults = {};
                self.defaults.Opacity = ViewUtilities.DEFAULT_OPACITY;
                self.defaults.MarkerColor = ViewUtilities.DEFAULT_COLOR;
                self.defaults.LineWidth = ViewUtilities.DEFAULT_LINEWIDTH;
                self.defaults.LineColor = ViewUtilities.DEFAULT_LINECOLOR;
                self.defaults.LineStyle = ViewUtilities.DEFAULT_LINESTYLE;
                self.defaults.FillColor = ViewUtilities.DEFAULT_FILLCOLOR;
                self.defaults.FillStyle = ViewUtilities.DEFAULT_FILLSTYLE;

                self.defaults.PointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10,
                    new SimpleLineSymbol(self.defaults.LineSymbol), ViewUtilities.getColor(self.defaults.MarkerColor)).toJson();
                self.defaults.LineSymbol = new SimpleLineSymbol(self.defaults.LineStyle,
                    ViewUtilities.getColor(self.defaults.tLineColor), self.defaults.LineWidth).toJson();
                self.defaults.FillSymbol = new SimpleFillSymbol(self.defaults.FillStyle,
                    new SimpleLineSymbol(self.defaults.LineSymbol), ViewUtilities.getColor(self.defaults.FillColor)).toJson();
            };

            getNodeValues = function (node, elements, payload, recurse) {
                if (node.attributes) {
                    for (let attribute of node.attributes) {
                        if (!elements || (elements.indexOf(attribute.name) >= 0)) {
                            console.log(attribute.name, attribute.value);
                            payload[attribute.name] = attribute.value;
                        }
                    }
                }

                for (let child of node.childNodes) {
                    if (!elements || (elements.indexOf(child.nodeName) >= 0)) {
                        let value = (child.innerText || child.text || child.textContent || "").trim();

                        if (value) {
                            console.log(child.nodeName, value);
                            payload[child.nodeName] = value;
                        }
                        if (child.attributes) {
                            for (let attribute of child.attributes) {
                                if (!elements || (elements.indexOf(attribute.name) >= 0)) {
                                    console.log(attribute.name, attribute.value);
                                    payload[attribute.name] = attribute.value;
                                }
                            }
                        }
                    }

                    if (recurse && child.hasChildNodes()) {
                        payload = getNodeValues(child, elements, payload, recurse);
                    }
                }

                return payload;
            };

            parse = function (node, level, document, folder, docId, folderId, currentId) {
                let newId = undefined;

                if ((node.nodeName == "Document") || (node.nodeName === "Folder")) {
                    if (level === undefined) {
                        level = 0;
                    } else {
                        level++;
                    }

                    if ((document === undefined) || (node.nodeName === "Document")) {
                        document = node;
                        if (node.nodeName === "Document") {
                            newId = resolveDocumentId(document);
                            docId = newId.id;
                            folderId = (folderId ? (folderId + "/" + docId) : docId);

                            self.kml.count++;
                            self.kml[folderId] = {
                                docId: folderId,
                                folderId: folderId,
                                type: "document",
                                name: newId.name
                            };

                            docId = folderId;
                            currentId = folderId;
                            if (folder === undefined) {
                                folderId = docId;
                            }
                        }
                    }
                    if ((folder === undefined) || (node.nodeName === "Folder")) {
                        folder = node;
                        if (node.nodeName === "Folder") {
                            newId = resolveFolderId(folder, folderId);
                            folderId = newId.id;

                            self.kml.count++;
                            self.kml[folderId] = {
                                docId: docId,
                                folderId: folderId,
                                type: "folder",
                                name: newId.name
                            };

                            currentId = folderId;
                        }
                    }

                    //console.log(level, node.nodeName.padStart((node.nodeName.length + level), '-'),
                    //    "doc:" + docId, "folder:" + folderId);
                } else {
                    if ((node.nodeName !== "#document") && (node.nodeName !== "kml")) {
                        if (level === undefined) {
                            level = 0;
                        } else {
                            level++;
                        }

                        //console.log(level, node.nodeName.padStart((node.nodeName.length + level), '-'));
                        let nodeValues = null, id = null;
                        switch (node.nodeName) {
                            case "Style":
                                nodeValues = (getNodeValues(node, ["id"], {}, false));
                                id = nodeValues.id;
                                if (!self.kml[currentId].hasOwnProperty("Style")) {
                                    self.kml[currentId].Style = {};
                                    self.kml[currentId].Style_Cache = {};
                                }
                                self.kml[currentId].Style[id] = node;
                                break;
                            case "StyleMap":
                                nodeValues = (getNodeValues(node, ["id"], {}, false));
                                id = nodeValues.id;
                                if (!self.kml[currentId].hasOwnProperty("StyleMap")) {
                                    self.kml[currentId].StyleMap = {};
                                    self.kml[currentId].StyleMap_Cache = {};
                                }
                                self.kml[currentId].StyleMap[id] = node;
                                break;
                            case "Placemark":
                                if (!self.kml[currentId].hasOwnProperty("Placemark")) {
                                    self.kml[currentId].Placemark = [node];
                                } else {
                                    self.kml[currentId].Placemark.push(node);
                                }
                                break;
                            case "Overlay":
                                if (!self.kml[currentId].hasOwnProperty("Overlay")) {
                                    self.kml[currentId].Overlay = [node];
                                } else {
                                    self.kml[currentId].Overlay.push(node);
                                }
                                break;
                            case "NetworkLink":
                                if (!self.kml[currentId].hasOwnProperty("NetworkLink")) {
                                    self.kml[currentId].NetworkLink = [node];
                                } else {
                                    self.kml[currentId].NetworkLink.push(node);
                                }
                                break;
                        }
                        return;
                    }
                }

                node = node.firstChild;
                while (node) {
                    // process element nodes only, not text nodes
                    if (node.nodeType === 1) {
                        parse(node, level, document, folder, docId, folderId, currentId);
                    }

                    node = node.nextSibling;
                }
            };

            resolveDocumentId = function (node) {
                let newId = undefined, name = undefined, uniqieId = undefined;

                self.uniqueId++;
                uniqueId = (new Date().getTime().toString(16)) + "-" + self.uniqueId;

                $.each(node.children, function (index, child) {
                    if (child.nodeName === "name") {
                        name = child.innerHTML;
                    } else if (child.nodeName === "id") {
                        newId = child.innerHTML + "-" + uniqueId;
                    }
                });

                if (!name && !newId) {
                    newId = name = uniqueId;
                } else if (!name) {
                    name = newId;
                } else if (!newId) {
                    newId = name.replace(/[ /]/g, "") + "-" + uniqueId;
                }

                if ((node.id !== undefined) && (node.id !== "")) {
                    newId = node.id.replace(/[ /]/g, "") + "-" + uniqueId;
                }

                return { name: name, id: newId };
            };

            resolveFolderId = function (node, id) {
                let newId = undefined, name = undefined, uniqieId = undefined;

                self.uniqueId++;
                uniqueId = (new Date().getTime().toString(16)) + "-" + self.uniqueId;

                $.each(node.children, function (index, child) {
                    if (child.nodeName === "name") {
                        name = child.innerHTML;
                    } else if (child.nodeName === "id") {
                        newId = child.innerHTML + "-" + uniqueId;
                    }
                });

                if (!name && !newId) {
                    newId = name = uniqueId;
                } else if (!name) {
                    name = newId;
                } else if (!newId) {
                    newId = name.replace(/[ /]/g, "") + "-" + uniqueId;
                }

                if ((node.id !== undefined) && (node.id !== "")) {
                    newId = node.id.replace(/[ /]/g, "") + "-" + uniqueId;
                }

                if (id !== undefined) {
                    newId = id + "/" + newId;
                }

                return { name: name, id: newId };
            };

            getStyleMap = function (docId, styleObject) {
                let styleMaps = self.kml[docId].StyleMap_Cache;
                let cacheObject;

                //If we have a style map then search for the styleUrl in that map
                if (styleMaps.hasOwnProperty(styleObject.url)) {
                    cacheObject = styleMaps[styleObject.url];
                    styleObject = cacheObject;
                }

                // if not previously defined; then check if map exists?
                if (!cacheObject) {
                    // update the styleMap for style pairs
                    let styleMapNode = self.kml[docId].StyleMap[styleObject.url];
                    if (styleMapNode) {
                        let jsonMap = JSUtilities.xmlToJson(styleMapNode);

                        let pLength = jsonMap.Pair.length, pair;
                        if (pLength > 0) {
                            for (let j = 0; j < pLength; j++) {
                                pair = jsonMap.Pair[j];

                                if (pair.key === "normal") {
                                    styleObject.url = pair.styleUrl.replace("#", "");
                                } else if (pair.key === "highlight") {
                                    styleObject.urlHighlight = pair.styleUrl.replace("#", "");
                                    styleObject.hasHighlight = true;
                                }
                            }

                            styleMaps[styleObject.url] = styleObject;
                        }
                    }
                }

                return styleObject;
            };

            getStyle = function (docId, styleObject, type, highlight) {
                let styles = self.kml[docId].Style_Cache;
                let url, resultStyle;

                // fix the url for highlight
                if (highlight) {
                    url = styleObject.urlHighlight;
                } else {
                    url = styleObject.url;
                }

                if (styles && styles[url + "_" + type]) {
                    console.log("cached style/" + url + "_" + type);
                    resultStyle = styles[url + "_" + type];
                }

                // if no style found; then we create and cache it
                if (!resultStyle) {
                    console.log("non-cached style/" + url + "_" + type);
                    let styleNode = self.kml[docId].Style[url];

                    if (styleNode) {
                        // create highlight style if ok
                        if (type === "Point") {
                            resultStyle = createIconSymbol(styleNode);
                        } else if (type === "LineString") {
                            resultStyle = createLineStringSymbol(styleNode);
                        } else if (type === "Polygon") {
                            resultStyle = createPolygonSymbol(styleNode);
                        }

                        // cache the style
                        styles[url + "_" + type] = resultStyle;
                    }
                }

                return resultStyle;
            };

            createIconSymbol = function (styleNode, baseStyle) {
                let style;

                let iconStyle = styleNode.getElementsByTagName("IconStyle");
                if (iconStyle && iconStyle.length > 0) {
                    let jsonMap = JSUtilities.xmlToJson(iconStyle[0]);

                    if ((jsonMap.Icon && jsonMap.Icon.href) || (baseStyle && baseStyle.url)) {
                        style = new PictureMarkerSymbol();

                        // copy base style to override from local style
                        if (baseStyle) {
                            style.angle = baseStyle.angle;
                            style.color = baseStyle.color;
                            //style.height = baseStyle.height;
                            //style.type = baseStyle.type;
                            style.url = baseStyle.url;
                            //style.width = baseStyle.width;
                            style.xoffset = baseStyle.xoffset;
                            style.xoffset = baseStyle.xoffset;
                        }

                        let hrefUrl = ((jsonMap.Icon && jsonMap.Icon.href) ? jsonMap.Icon.href : style.url);
                        if (hrefUrl.startsWith("milstd:")) {
                            let milstdSymbol = new ms.Symbol(hrefUrl.split(":")[1]);
                            style.setUrl(milstdSymbol.toDataURL());
                        } else {
                            style.setUrl(hrefUrl);
                        }
                        if (jsonMap.color) {
                            style.setColor(ViewUtilities.getColor(jsonMap.color, null, jsonMap.colorMode));
                        }
                        if (jsonMap.scale) {
                            let size = style.width * jsonMap.scale;
                            style.setHeight(size);
                            style.setWidth(size);
                        } else {
                            if (baseStyle) {
                                style.height = baseStyle.height;
                                style.width = baseStyle.width;
                            }
                        }
                        if (jsonMap.heading) {
                            let angle = jsonMap.heading;
                            style.setAngle(angle);
                        }
                    } else if (jsonMap.color || jsonMap.colorMode) {
                        style = new SimpleMarkerSymbol(self.defaults.PointSymbol);

                        if (baseStyle) {
                            style.angle = baseStyle.angle;
                            style.color = baseStyle.color;
                            //style.type = baseStyle.type;
                            style.size = baseStyle.size;
                            //style.style = baseStyle.style;
                            style.xoffset = baseStyle.xoffset;
                            style.xoffset = baseStyle.xoffset;
                        }

                        if (!jsonMap.color) {
                            jsonMap.color = style.color;
                        }
                        style.setColor(ViewUtilities.getColor(jsonMap.color, null, jsonMap.colorMode));
                        if (jsonMap.scale) {
                            let size = 10 * jsonMap.scale;
                            style.setSize(size);
                        }
                    }
                }

                return style;
            };

            // retrieve document style/map and merge with local style
            createLineStringSymbol = function (styleNode, baseStyle) {
                let style;

                let lineStyle = styleNode.getElementsByTagName("LineStyle");
                if (lineStyle && lineStyle.length > 0) {
                    let jsonMap = JSUtilities.xmlToJson(lineStyle[0]);
                    style = new SimpleLineSymbol(self.defaults.LineSymbol);

                    let width = self.defaults.LineWidth;
                    if (baseStyle && baseStyle.width) {
                        width = baseStyle.width;
                    } else if (jsonMap.width) {
                        width = jsonMap.width;
                    }
                    style.setWidth(width);

                    let color = self.defaults.LineColor;
                    if (baseStyle && baseStyle.color) {
                        color = baseStyle.color;
                    } else if (jsonMap.color) {
                        color = jsonMap.color;
                    }
                    if (jsonMap.colorMode && (jsonMap.colorMode === "random")) {
                        color = ViewUtilities.getColor(color, null, jsonMap.colorMode)
                    }
                    style.setColor(color);
                }

                return style;
            };

            // retrieve document style/map and merge with local style
            createPolygonSymbol = function (styleNode, baseStyle) {
                let style;

                let polyStyle = styleNode.getElementsByTagName("PolyStyle");
                if (polyStyle && polyStyle.length > 0) {
                    let jsonMap = JSUtilities.xmlToJson(polyStyle[0]);
                    style = new SimpleFillSymbol(self.defaults.FillSymbol);

                    // create fill style
                    let opacity = self.defaults.Opacity;
                    if (jsonMap.fill || (jsonMap.fill === 0)) {
                        opacity = 0;
                    }
                    if (self.params.opacity) {
                        opacity = self.params.opacity;
                    }

                    let color = self.defaults.FillColor;
                    if (baseStyle && baseStyle.color) {
                        color = baseStyle.color;
                    } else if (jsonMap.color) {
                        color = jsonMap.color;
                    }
                    if (jsonMap.colorMode && (jsonMap.colorMode === "random")) {
                        color = ViewUtilities.getColor(color, opacity, jsonMap.colorMode)
                    }
                    style.setColor(color);

                    // create ouline style based on line style
                    if (jsonMap.outline && (jsonMap.outline === 1)) {
                        let outline = createLineStringSymbol(styleNode, baseStyle.outline);
                        if (!outline) {
                            outline = new SimpleLineSymbol(self.defaults.LineSymbol);
                        }
                        style.setOutline(outline);
                    }
                }

                return style;
            };

            // retrieve document style/map and merge with local style
            resolveStyle = function (layer, placemark, type) {
                let returnStyle = {};

                // get the docId for the layer
                let docId = layer.docId;
                let document = self.kml[docId];
                console.log(layer, document, placemark);

                // create base styleObject which is updated
                let styleObject = {
                    normal: self.defaults.PointSymbol,
                    highlight: self.defaults.PointSymbol,
                    hasHighlight: false
                };
                if (type === "LineString") {
                    styleObject.normal = self.defaults.LineSymbol;
                    styleObject.highlight = self.defaults.LineSymbol;
                } else if (type === "Polygon") {
                    styleObject.normal = self.defaults.FillSymbol;
                    styleObject.highlight = self.defaults.FillSymbol;
                }

                // process the document style for placemark
                let styleUrl = placemark.getElementsByTagName("styleUrl");
                if (styleUrl && (styleUrl.length > 0) && styleUrl[0].textContent && styleUrl[0].textContent.trim()) {
                    styleObject.url = styleUrl[0].textContent.trim().replace("#", "");

                    // if styleMap or style; both need to be resolved
                    if (styleObject.url) {
                        styleObject = getStyleMap(docId, styleObject);

                        // if highlight specified
                        if (styleObject.hasHighlight) {
                            returnStyle.highlight = getStyle(docId, styleObject, type, true);
                        }

                        // create Style (append if required)
                        returnStyle.normal = getStyle(docId, styleObject, type);
                    }
                }

                // process local style in placemark
                let style = placemark.getElementsByTagName("Style");
                if (style && (style.length > 0)) {
                    if (type === "Point") {
                        returnStyle.normal = createIconSymbol(style[0], returnStyle.normal);
                    } else if (type === "LineString") {
                        returnStyle.normal = createLineStringSymbol(style[0], returnStyle.normal);
                    } else if (type === "Polygon") {
                        returnStyle.normal = createPolygonSymbol(style[0], returnStyle.normal);
                    }

                    // if there is a highlight symbol, then we need to clone and update
                    if (returnStyle.highlight) {
                        if (type === "Point") {
                            returnStyle.highlight = createIconSymbol(style[0], returnStyle.highlight);
                        } else if (type === "LineString") {
                            returnStyle.highlight = createLineStringSymbol(style[0], returnStyle.highlight);
                        } else if (type === "Polygon") {
                            returnStyle.highlight = createPolygonSymbol(style[0], returnStyle.highlight);
                        }
                    }
                }

                // if no style is specified for normal use the default symbol
                if (!returnStyle.normal) {
                    if (type === "Point") {
                        returnStyle.normal = new SimpleMarkerSymbol(self.defaults.PointSymbol);
                    } else if (type === "LineString") {
                        returnStyle.normal = new SimpleLineSymbol(self.defaults.LineSymbol);
                    } else if (type === "Polygon") {
                        returnStyle.normal = new SimpleFillSymbol(self.defaults.FillSymbol);
                    }
                }

                // if no style is specified for highlighed use the normal symbol
                if (!styleObject.hasHighlight) {
                    returnStyle.highlight = returnStyle.normal;
                }

                console.log(returnStyle);
                return returnStyle;
            };

            // process all features objects (Placemarks)
            loadPlacemarks = function () {
                $.each(self.kml, function (index, subLayer) {
                    if ((index === "name") || (index === "count")) {

                    } else {
                        console.log(subLayer);
                        subLayer["graphicsLayer"] = new GraphicsLayer({ id: subLayer.folderId });

                        // check the placemark type - MultiGeometry, Point, LineString, Polygon
                        $.each(subLayer.Placemark, function (pIndex, placemark) {
                            console.log(placemark, placemark.nodeName);
                            processPlacemark(subLayer, placemark);
                        });

                        registerEvents(subLayer["graphicsLayer"]);
                    }
                });
            };

            processPlacemark = function (layer, placemark) {
                let len = placemark.childNodes.length;
                let child = placemark.firstChild;

                let attributes = {};
                // process the attributes
                $.each(placemark.attributes, function (index, attribute) {
                    attributes[attribute.name] = attribute.textContent;
                });

                for (let i = 0; i < len; i++) {
                    // process element nodes only, not text nodes
                    if (child.nodeType === 1) {
                        console.log(".. " + child.nodeName, child.nodeType, child.textContent);

                        let style;
                        switch (child.nodeName) {
                            case "id":
                            case "name":
                            case "address":
                            case "phoneNumber":
                                attributes[child.nodeName] = child.textContent;
                                break;

                            case "MultiGeometry":
                                break;
                            case "Point":
                                style = resolveStyle(layer, placemark, child.nodeName);
                                processPlacemarkPoint(layer, placemark, attributes, style);
                                break;
                            case "LineString":
                                style = resolveStyle(layer, placemark, child.nodeName);
                                processPlacemarkLine(layer, placemark, attributes, style);
                                break;
                            case "Polygon":
                                style = resolveStyle(layer, placemark, child.nodeName);
                                processPlacemarkPolygon(layer, placemark, attributes, style);
                                break;
                        };
                    }

                    child = child.nextSibling;
                }
            };

            processPlacemarkPoint = function (layer, placemark, attributes, style) {
                let len = placemark.childNodes.length;
                let child = placemark.firstChild;

                console.log(placemark, attributes);
                let coordinates;

                // process the elements
                for (let i = 0; i < len; i++) {
                    // process element nodes only, not text nodes
                    if (child.nodeType === 1) {
                        switch (child.nodeName) {
                            case "Point":
                                coordinates = child.getElementsByTagName("coordinates");

                                if (coordinates && coordinates.length > 0) {
                                    let coords = coordinates[0].textContent.replace(/\s+/g, ' ').replace(/, /g, ',').split(",");
                                    if (coords.length > 1) {
                                        let point = new Point(parseFloat(coords[0]), parseFloat(coords[1]));
                                        // point = webMercatorUtils.project(point, new SpatialReference(4326));

                                        let popupTemplate = updatePopupTemplate(params.popupTemplate, attributes);
                                        let graphic = new Graphic(point, style.normal, attributes, popupTemplate);
                                        graphic.normalSymbol = style.normal;
                                        graphic.highlightSymbol = style.highlight;

                                        console.log(JSON.stringify(graphic));
                                        layer.graphicsLayer.add(graphic);
                                    }
                                }

                                break;
                        };
                    }

                    child = child.nextSibling;
                }
            };

            getRingsGeometry = function (placemark) {
                let coordinates = placemark.getElementsByTagName("coordinates");
                let rings = [];

                if (coordinates && coordinates.length > 0) {
                    $.each(coordinates, function (index, coordinate) {
                        let iRings = [], pRings = [];
                        let coordinatesArray = coordinate.textContent.replace(/\s+/g, ' ').replace(/, /g, ',').split(' ');
                        $.each(coordinatesArray, function (caIndex, pCoordinates) {
                            pCoordinates = pCoordinates.split(',');

                            pRings.push([pCoordinates[0], pCoordinates[1]]);
                        });

                        // fix rings due to spaces
                        for (let i = 0; i < pRings.length; i++) {
                            if (pRings[i][1] !== undefined) {
                                if (pRings[i][1] !== "") {
                                    iRings.push(pRings[i]);
                                } else if (pRings[i][1] === "") {
                                    iRings.push([pRings[i][0], pRings[i + 1][0]]);
                                    i++;
                                }
                            }
                        }

                        rings.push(iRings);
                    });
                }

                return rings;
            };

            processPlacemarkLine = function (layer, placemark, attributes, style) {
                let len = placemark.childNodes.length;
                let child = placemark.firstChild;

                console.log(placemark, attributes);

                // process the elements
                for (let i = 0; i < len; i++) {
                    // process element nodes only, not text nodes
                    if (child.nodeType === 1) {
                        switch (child.nodeName) {
                            case "LineString":
                                let rings = getRingsGeometry(placemark);

                                if (rings) {
                                    let polyline = new Polyline({
                                        "paths": rings
                                    });

                                    let popupTemplate = updatePopupTemplate(params.popupTemplate, attributes);
                                    let graphic = new Graphic(polyline, style.normal, attributes, popupTemplate);
                                    graphic.normalSymbol = style.normal;
                                    graphic.highlightSymbol = style.highlight;

                                    console.log(JSON.stringify(graphic));
                                    layer.graphicsLayer.add(graphic);
                                }

                                break;
                        };
                    }

                    child = child.nextSibling;
                }
            };

            processPlacemarkPolygon = function (layer, placemark, attributes, style) {
                let len = placemark.childNodes.length;
                let child = placemark.firstChild;

                console.log(placemark, attributes);

                // process the elements
                for (let i = 0; i < len; i++) {
                    // process element nodes only, not text nodes
                    if (child.nodeType === 1) {
                        switch (child.nodeName) {
                            case "Polygon":
                                let rings = getRingsGeometry(placemark);

                                if (rings) {
                                    let polygon = new Polygon({
                                        "rings": rings
                                    });

                                    let popupTemplate = updatePopupTemplate(params.popupTemplate, attributes);
                                    let graphic = new Graphic(polygon, style.normal, attributes, popupTemplate);
                                    graphic.normalSymbol = style.normal;
                                    graphic.highlightSymbol = style.highlight;

                                    layer.graphicsLayer.add(graphic);
                                }

                                break;
                        };
                    }

                    child = child.nextSibling;
                }
            };

            updatePopupTemplate = function (popupTemplate, attributes) {
                let newPopupTemplate = null;
                if (!popupTemplate || !popupTemplate.content) {
                    newPopupTemplate = new InfoTemplate();
                    newPopupTemplate.setTitle("${Name}");
                    var description = attributes.Description ? (attributes.Description + "<hr>") : "";
                    description +=
                        "<div class=\"esriViewPopup\"><div class=\"mainSection\"><table class=\"attrTable\" cellpadding=\"2px\" cellspacing=\"0px\"> " +
                        "<tbody> ";
                    for (var field in attributes) {
                        if (field !== "Description") {
                            description += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" + attributes[field] + "</td></tr> ";
                        }
                    };
                    description +=
                        "</tbody> " +
                        "</table></div></div>";
                    newPopupTemplate.setContent(description);
                } else {
                    newPopupTemplate = new InfoTemplate(attributes.name, self.popupTemplate.content);
                }

                return newPopupTemplate;
            }

            loadOverlays = function () {

            };

            loadNetworkLinks = function () {

            };

            // layer events
            registerEvents = function (layer) {
                layer.on("mouse-over", function ($event) {
                    onMouseOver($event);
                });
                layer.on("mouse-out", function ($event) {
                    onMouseOut($event);
                });
            };

            onMouseOver = function ($event) {
                $event.graphic.setSymbol($event.graphic.highlightSymbol);
            };
            onMouseOut = function ($event) {
                $event.graphic.setSymbol($event.graphic.normalSymbol);
            };

            self.init();
        };

        return KML2GraphicsLayer;
    });