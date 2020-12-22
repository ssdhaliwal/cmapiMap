define([],
    function () {

        let KML2GraphicsLayer = function (name, document) {
            let self = this;
            self.document = document;
            self.graphicsLayer = null;
            self.kml = {
                name: name
            };
            self.uniqueId = 0;

            self.init = function () {
                self.document = document;

                initializeDefaultStyles();
                parse(self.document);
            };

            initializeDefaultStyles = function () {
                self.defaultMarkerColor = "#504FB0DA";
                self.defaultLineWidth = 2;
                self.defaultLineColor = "#50000000";
                self.defaultLineStyle = SimpleLineSymbol.STYLE_SOLID;
                self.defaultFillColor = "#500F7CF8";
                self.defaultFillStyle = SimpleFillSymbol.STYLE_SOLID;
                self.defaultLineSymbol = new SimpleLineSymbol(self.defaultLineStyle,
                    this._getColor(self.defaultLineColor), self.defaultLineWidth).toJson();
                self.defaultPointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10,
                    new SimpleLineSymbol(self.defaultLineSymbol), this._getColor(self.defaultMarkerColor)).toJson();
                self.defaultFillSymbol = new SimpleFillSymbol(self.defaultFillStyle,
                    new SimpleLineSymbol(self.defaultLineSymbol), this._getColor(self.defaultFillColor)).toJson();
            };

            parse = function (node, level, document, folder, docId, pDocId, folderId, currentId) {
                if ((node.nodeName == "Document") || (node.nodeName === "Folder")) {
                    if (level === undefined) {
                        level = 0;
                    } else {
                        level++;
                    }

                    pDocId = pDocId || docId;

                    if ((document === undefined) || (node.nodeName === "Document")) {
                        document = node;
                        if (node.nodeName === "Document") {
                            docId = resolveElementId(document, docId);
                            self.kml[docId] = {
                                docId: docId,
                                folderId: folderId || docId,
                                pDocId: undefined,
                                type: "document"
                            };

                            pDocId = docId;
                            currentId = pDocId;
                            if (folder === undefined) {
                                folderId = docId;
                            }
                        }
                    }
                    if ((folder === undefined) || (node.nodeName === "Folder")) {
                        folder = node;
                        if (node.nodeName === "Folder") {
                            folderId = resolveElementId(folder, docId);
                            self.kml[folderId] = {
                                docId: docId,
                                folderId: folderId,
                                pDocId: pDocId,
                                type: "folder"
                            };

                            currentId = folderId;
                        }
                    }

                    console.log(level, node.nodeName.padStart((node.nodeName.length + level), '-'),
                        "doc:" + docId, "folder:" + folderId);
                } else {
                    if ((node.nodeName !== "#document") && (node.nodeName !== "kml")) {
                        if (level === undefined) {
                            level = 0;
                        } else {
                            level++;
                        }

                        console.log(level, node.nodeName.padStart((node.nodeName.length + level), '-'));

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
                        }
                        return;
                    }
                }

                node = node.firstChild;
                while (node) {
                    if (node.nodeType == 1) {
                        parse(node, level, document, folder, docId, pDocId, folderId, currentId);
                    }

                    node = node.nextSibling;
                }
            };

            resolveElementId = function (node, id) {
                let newId = undefined;

                $.each(node.children, function (index, child) {
                    if (child.nodeName === "name") {
                        newId = child.innerHTML;
                        return false;
                    }
                });
                if ((node.id !== undefined) && (node.id !== "")) {
                    newId = node.id;
                }

                self.uniqueId++;
                if (id === undefined) {
                    id = newId || ((new Date().getTime().toString(16)) + "." + self.uniqueId);
                } else {
                    id += "/" + (newId || ((new Date().getTime().toString(16)) + "." + self.uniqueId));
                }

                return id;
            };

            // retrieve document style/map and merge with local style
            resolveStyle = function (kml, styleId, style) {

            };

            // process all features objects (Placemarks)
            loadPlacemarks = function (kml) {

            };

            loadOverlays = function (kml) {

            };

            loadNetworkLinks = function (kml) {

            };

            self.init();
        };

        return KML2GraphicsLayer;
    });