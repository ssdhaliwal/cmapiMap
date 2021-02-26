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
                self.defaults.MarkerColor = ViewUtilities.DEFAULT_COLOR;
                self.defaults.LineWidth = ViewUtilities.DEFAULT_LINEWIDTH;
                self.defaults.LineColor = ViewUtilities.DEFAULT_LINECOLOR;
                self.defaults.LineStyle = ViewUtilities.DEFAULT_LINESTYLE;
                self.defaults.FillColor = ViewUtilities.DEFAULT_FILLCOLOR;
                self.defaults.FillStyle = SimpleFillSymbol.DEFAULT_FILLSTYLE;

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

            getColor = function (color, opacity, colorMode) {
                if ((opacity === null) || (opacity === undefined)) {
                    if (self.properties && self.properties.opacity) {
                        opacity = self.properties.opacity * 255;
                    }
                } else {
                    opacity = opacity * 255;
                }

                if (color) {
                    let featureColor;

                    if (Array.isArray(color)) {
                        if (color.length === 4) {
                            featureColor = new Color([color[0], color[1], color[2], (opacity || color[3] || 100)]);
                        } else if (color.length === 3) {
                            featureColor = new Color([color[0], color[1], color[2], (opacity || 100)]);
                        }
                    } else if (typeof color === "object") {
                        if (('r' in color) && ('g' in color) && ('b' in color) && !('a' in color)) {
                            featureColor = new Color([color.r, color.g, color.b, (opacity || 100)]);
                        } else if (('r' in color) && ('g' in color) && ('b' in color) && ('a' in color)) {
                            featureColor = new Color([color.r, color.g, color.b, (opacity || color.a || 100)]);
                        }
                    } else {
                        if (!color.startsWith("#")) {
                            color = "#" + color;
                        }

                        if ((opacity === null) || (opacity === undefined)) {
                            if (color.length > 8) {
                                opacity = parseInt(color.substring(7, 9), 16);
                            } else {
                                opacity = 100;
                            }
                        }

                        featureColor = new Color([parseInt(color.substring(1, 3), 16),
                        parseInt(color.substring(3, 5), 16),
                        parseInt(color.substring(5, 7), 16), opacity]);
                    }

                    if (featureColor) {
                        if (colorMode && colorMode === "random") {
                            featureColor = JSUtilities.getRandomColor(featureColor);
                        }
                        return featureColor;
                    }
                }

                return getColor(self.defaultFillColor);
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
                    let node = self.kml[docId].StyleMap[styleObject.url];
                    if (node) {
                        let jsonMap = JSUtilities.xmlToJson(node);
                        console.log(jsonMap);
                        /*
                        let pairs = node.getElementsByTagName("Pair"),
                            key = "", url = "", pLength = 0;

                        pLength = pairs.length;
                        if (pLength > 0) {
                            for (let j = 0; j < pLength; j++) {
                                pair = pairs[j];
                                key = pair.getElementsByTagName("key")[0];
                                url = pair.getElementsByTagName("styleUrl")[0];

                                if (key.textContent.trim() === "normal") {
                                    styleObject.url = url.textContent.trim();
                                } else if (key.textContent.trim() === "highlight") {
                                    styleObject.urlHighlight = url.textContent.trim();
                                    styleObject.hasHighlight = true;
                                }
                            }
                        }
                        */
                    }
                }

                return styleObject;
            };

            getStyle = function (docId, styleUrl) {
                let styles = self.kml[docId].Style_Cache;

                if (styles && styles[styleUrl]) {
                    return styles[styleUrl];
                }

                return null;
            };

            createIconSymbol = function (iconStyle, baseStyle) {
                let nodeElements = ["href", "color", "scale", "heading", "hotspot", "colorMode"];

                let style;
                let styleObject = getNodeValues(iconStyle[0], nodeElements, {}, true);

                if (styleObject.href || (baseStyle && baseStyle.url)) {
                    style = new PictureMarkerSymbol();

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

                    let hrefUrl = styleObject.href || style.url;
                    if (hrefUrl.startsWith("milstd:")) {
                        let milstdSymbol = new ms.Symbol(hrefUrl.split(":")[1]);
                        style.setUrl(milstdSymbol.toDataURL());
                    } else {
                        style.setUrl(hrefUrl);
                    }
                    if (styleObject.color) {
                        style.setColor(getColor(styleObject.color, null, styleObject.colorMode));
                    }
                    if (styleObject.scale) {
                        let size = style.width * styleObject.scale;
                        style.setHeight(size);
                        style.setWidth(size);
                    } else {
                        if (baseStyle) {
                            style.height = baseStyle.height;
                            style.width = baseStyle.width;
                        }
                    }
                    if (styleObject.heading) {
                        let angle = styleObject.heading;
                        style.setAngle(angle);
                    }
                } else if (styleObject.color || styleObject.colorMode) {
                    style = new SimpleMarkerSymbol();

                    if (baseStyle) {
                        style.angle = baseStyle.angle;
                        style.color = baseStyle.color;
                        //style.type = baseStyle.type;
                        style.size = baseStyle.size;
                        //style.style = baseStyle.style;
                        style.xoffset = baseStyle.xoffset;
                        style.xoffset = baseStyle.xoffset;
                    }

                    if (!styleObject.color) {
                        styleObject.color = style.color;
                    }
                    style.setColor(getColor(styleObject.color, null, styleObject.colorMode));
                    if (styleObject.scale) {
                        var size = 10 * styleObject.scale;
                        style.setSize(size);
                    }
                }

                return style;
            };

            // retrieve document style/map and merge with local style
            resolvePointStyle = function (layer, placemark) {
                let returnStyle = {};

                // get the docId for the layer
                let docId = layer.docId;
                let document = self.kml[docId];
                let styleMaps = self.kml[docId].StyleMap;
                let styleMapCache = self.kml[docId].StyleMap_Cache;
                let styles = self.kml[docId].Style;
                let styleCache = self.kml[docId].Style_Cache;
                console.log(layer, document, placemark);

                let styleObject = {
                    normal: self.defaults.PointSymbol,
                    highlight: self.defaults.PointSymbol,
                    hasHighlight: false
                };

                // process the document style for placemark
                let styleUrl = placemark.getElementsByTagName("styleUrl");
                if (styleUrl && (styleUrl.length > 0) && styleUrl[0].textContent && styleUrl[0].textContent.trim()) {
                    styleObject.url = styleUrl[0].textContent.trim().replace("#", "");

                    // if styleMap or style; both need to be resolved
                    if (styleObject.url) {
                        styleObject = getStyleMap(docId, styleObject);

                        // if highlight specified
                        if (styleObject.hasHighlight) {
                            let hightlightStyle = getStyle(docId, styleObject.urlHighlight + "_PointStyle");
                            if (hightlightStyle) {
                                returnStyle.highlight = hightlightStyle;
                            } else {
                                hightlightStyle = styles[styleObject.urlHighlight];
                                let iconStyle = hightlightStyle.getElementsByTagName("IconStyle");
                                if (iconStyle && (iconStyle.length > 0)) {
                                    returnStyle.highlight = createIconSymbol(iconStyle);
                                    styleCache[styleObject.urlHighlight + "_PointStyle"] = returnStyle.highlight;
                                } else {
                                    styleObject.hasHighlight = false;
                                }
                            }
                        }

                        // create Style (append if required)
                        let normalStyle = getStyle(docId, styleObject.url + "_PointStyle");
                        if (normalStyle) {
                            returnStyle.normal = normalStyle;
                        } else {
                            normalStyle = styles[styleObject.url];
                            let iconStyle = normalStyle.getElementsByTagName("IconStyle");
                            returnStyle.normal = createIconSymbol(iconStyle);
                            styleCache[styleObject.url + "_PointStyle"] = returnStyle.normal;
                        }
                    }
                }

                // process local style in placemark
                let style = placemark.getElementsByTagName("Style");
                if (style && (style.length > 0)) {
                    let iconStyle = style[0].getElementsByTagName("IconStyle");
                    if (iconStyle && iconStyle.length > 0) {
                        returnStyle.normal = createIconSymbol(iconStyle, returnStyle.normal);
                    }

                    // if there is a highlight symbol, then we need to clone and update
                    if (returnStyle.highlight) {
                        returnStyle.highlight = createIconSymbol(iconStyle, returnStyle.highlight);
                    }
                }

                // if no style is specified for normal use the default symbol
                if (!returnStyle.normal) {
                    returnStyle.normal = new SimpleMarkerSymbol(self.defaults.PointSymbol);
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
                                let style = resolvePointStyle(layer, placemark);
                                processPlacemarkPoint(layer, placemark, attributes, style);
                                break;
                            case "LineString":
                                break;
                            case "Polygon":
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

                                        layer.graphicsLayer.add(graphic);
                                    }
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

            self.init();
        };

        return KML2GraphicsLayer;
    });