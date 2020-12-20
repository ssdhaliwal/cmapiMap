define([],
    function () {

        let KML2GraphicsLayer = function (name, document) {
            let self = this;
            self.document = document;
            self.graphicsLayer = null;
            self.kml = {
                name: name
            };

            self.init = function () {
                self.document = document;

                parse(self.document);
            };

            parse = function (node, level, document, folder, docId, folderId) {
                if ((node.nodeName !== "#document") && (node.nodeName !== "kml")) {
                    if (level === undefined) {
                        level = 0;
                    } else {
                        level++;
                    }

                    if ((document === undefined) || (node.nodeName === "Document")) {
                        document = node;
                        if (node.nodeName === "Document") {
                            docId = resolveElementId(document, docId);
                            self.kml[docId] = {
                                docId: docId,
                                folderId: folderId || docId
                            };

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
                                docId: docId || folderId,
                                folderId: folderId
                            };

                            if (document === undefined) {
                                docId = folderId;
                            }
                        }
                    }

                    console.log(level, node.nodeName.padStart((node.nodeName.length + level), '-'),
                        "doc:" + docId, "folder:" + folderId);
                }

                node = node.firstChild;
                while (node) {
                    if (node.nodeType == 1) {
                        parse(node, level, document, folder, docId, folderId);
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

                if (id === undefined) {
                    id = newId || new Date().getTime().toString(16);
                } else {
                    id += "/" + (newId || new Date().getTime().toString(16));
                }

                return id;
            };

            // get all <Style> <StyleMap> for the node into array
            loadStyles = function (node) {

            };

            // retrieve document style/map and merge with local style
            resolveStyle = function (styleId, style) {

            };

            // process all features objects (Placemarks)
            loadPlacemarks = function (node) {

            };

            loadOverlays = function (node) {

            };

            loadNetworkLinks = function (node) {

            };

            self.init();
        };

        return KML2GraphicsLayer;
    });