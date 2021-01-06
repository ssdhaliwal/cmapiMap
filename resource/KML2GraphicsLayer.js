define(["esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/graphic", "esri/SpatialReference", "esri/geometry/Point", "esri/geometry/Polyline", "esri/geometry/Polygon",
    "esri/layers/GraphicsLayer", "esri/InfoTemplate",
    "plugins/ViewUtilities", "milsymbol"],
    function (SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
        Graphic, SpatialReference, Point, Polyline, Polygon, GraphicsLayer, InfoTemplate,
        ViewUtilities, mil2525) {

        let KML2GraphicsLayer = function (name, document) {
            let self = this;
            self.document = document;
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
                        switch (node.nodeName) {
                            case "Style":
                                if (!self.kml[currentId].hasOwnProperty("Style")) {
                                    self.kml[currentId].Style = [node];
                                } else {
                                    self.kml[currentId].Style.push(node);
                                }
                                break;
                            case "StyleMap":
                                if (!self.kml[currentId].hasOwnProperty("StyleMap")) {
                                    self.kml[currentId].StyleMap = [node];
                                } else {
                                    self.kml[currentId].StyleMap.push(node);
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

            // retrieve document style/map and merge with local style
            resolveStyle = function (docId, styleId, style) {

            };

            // process all features objects (Placemarks)
            loadPlacemarks = function () {
                $.each(self.kml, function (index, subLayer) {
                    if ((index === "name") || (index === "count")) {

                    } else {
                        console.log(subLayer);
                        subLayer["graphicsLayer"] = new GraphicsLayer({ id: subLayer.id });

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

                            case "styleUrl":
                            case "Style":
                            case "StyleMap":
                                break;

                            case "MultiGeometry":
                                break;
                            case "Point":
                                processPlacemarkPoint(layer, placemark, attributes);
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

            processPlacemarkPoint = function (layer, placemark, attributes) {
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
                                        let point = new Point(coords[0], coords[1], new SpatialReference({
                                            wkid: 4326
                                        }));

                                        let graphic = new Graphic(point);
                                        layer.graphicsLayer.add(graphic);
                                        console.log(coords, attributes);
                                    }
                                }

                                break;
                        };
                    }

                    child = child.nextSibling;
                }
            };

            loadOverlays = function () {

            };

            loadNetworkLinks = function () {

            };

            self.init();
        };

        return KML2GraphicsLayer;
    });