define(["esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/graphic", "esri/SpatialReference", "esri/geometry/webMercatorUtils",
    "esri/geometry/Point", "esri/geometry/Polyline", "esri/geometry/Polygon",
    "esri/layers/GraphicsLayer", "esri/InfoTemplate",
    "esri/Color",
    "plugins/ViewUtilities", "milsymbol"],
    function (SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
        Graphic, SpatialReference, webMercatorUtils, 
        Point, Polyline, Polygon, GraphicsLayer, InfoTemplate,
        Color,
        ViewUtilities, mil2525) {

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
                if (node.hasAttributes()) {
                    for (var attribute of node.attributes) {
                        payload[attribute.name] = attribute.value;
                    }
                }

                for (var child of node.childNodes) {
                    if (elements.indexOf(child.nodeName) >= 0) {
                        var value = (child.innerText || child.text || child.textContent);

                        payload[child.nodeName] = {};
                        if (value.trim()) {
                            payload[child.nodeName] = value.trim();
                        }
                        if (child.hasAttributes()) {
                            for (var attribute of child.attributes) {
                                payload[child.nodeName][attribute.name] = attribute.value;
                            }
                        }
                    }

                    if (recurse && child.hasChildNodes()) {
                        payload = this.getNodeValues(child, elements, payload[child.nodeName], recurse);
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
                        let style = null, id = null;
                        switch (node.nodeName) {
                            case "Style":
                                style = (this.getNodeValues(node, ["id"], {}, false));
                                id = style.id;
                                if (!self.kml[currentId].hasOwnProperty("Style")) {
                                    self.kml[currentId].Style = [{id: node}];
                                } else {
                                    self.kml[currentId].Style.push({id: node});
                                }
                                break;
                            case "StyleMap":
                                style = (this.getNodeValues(node, ["id"], {}, false));
                                id = style.id;
                                if (!self.kml[currentId].hasOwnProperty("StyleMap")) {
                                    self.kml[currentId].StyleMap = [{id: node}];
                                } else {
                                    self.kml[currentId].StyleMap.push({id: node});
                                }
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
                                    self.kml[currentId].Placemark = [node];
                                } else {
                                    self.kml[currentId].Placemark.push(node);
                                }
                                break;
                            case "NetworkLink":
                                if (!self.kml[currentId].hasOwnProperty("NetworkLink")) {
                                    self.kml[currentId].Placemark = [node];
                                } else {
                                    self.kml[currentId].Placemark.push(node);
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

            _findStyleMap = function (layer, url) {
                var styleMaps = this.styleMaps;
                var styleMap;

                //If we have a style map then search for the styleUrl in that map
                if (styleMaps && styleMaps.length > 0) {
                    for (var i = 0; i < styleMaps.length; i++) {
                        if ("#" + styleMaps[i].id === url) {
                            styleMap = styleMaps[i];
                            break;
                        }
                    }
                }

                return styleMap;
            };

            // retrieve document style/map and merge with local style
            resolvePointStyle = function (layer, placemark) {
                let style = {
                    normal: self.defaults.PointSymbol,
                    highlighted: self.defaults.PointSymbol
                };

                // see if styleUrl specified
                console.log(layer, placemark);

                // see if style specified

                // fix for missing normal or high-lighed style

                return style;
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
                                let style = this.resolvePointStyle(layer, placemark);
                                this.processPlacemarkPoint(layer, placemark, attributes, style);
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

                                        let popupTemplate = this.updatePopupTemplate(params.popupTemplate, attributes);
                                        let graphic = new Graphic(point, style.normal, attributes, popupTemplate);
                                        graphic.normalSymbol = style.normal;
                                        graphic.highlightSymbol = style.highlighted;

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
                    newPopupTemplate = new InfoTemplate(attributes.name, this.popupTemplate.content);
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