define(["plugins/ViewUtilities"],
    function (ViewUtilities) {

        let ogcKML = function (global, service) {
            let self = this;
            self.map = global.plugins.extMap.instance;
            self.search = global.plugins.extSearch;
            self.notify = global.plugins.extNotify;
            self.message = global.interfaces.messageService;
            self.service = service;
            self.layer = null;
            self.selectedFeatures = [];

            self.init = function () {
                // parse dom
                // collect root documents
                // for each document
                // .. add node to tree
                // .. collect styles <- Document
                // .. collect schema <- Document
                // .. collect folders <- Document
                // .. collect features
                // .. for each feature
                // .. .. process feature using docStyle <- localStyle
                // .. for each folder/document
                // .. .. add node to tree
                // .. .. collect styles <- Document
                // .. .. collect schema <- Document
                // .. .. collect features
                // .. .. for each feature
                // .. .. .. process feature using docStyle <- localStyle

                getKML();
                //self.registerEvents();
            };

            self.handleClick = function () {
            };

            self.registerEvents = function () {
            };

            self.remove = function () {
                console.log("... removed layer: " + self.service.text);
                /*
                self.map.removeLayer(self.layer);
                $.each(self.selectedFeatures, function (index, feature) {
                    self.message.sendMessage("map.feature.deselected",
                        JSON.stringify({
                            overlayId: self.service.overlayId,
                            featureId: self.service.id,
                            deSelectedId: feature.deselectedId,
                            deSelectedName: feature.deselectedName
                        }));
                });
                self.selectedFeatures = [];
                */
            };

            getKML = function () {
                let layer = self.service.layer;

                // reads kml from properties or url (if kmz, unzips it also)
                if (layer.hasOwnProperty("data")) {
                    parseKml(layer.properties.data);
                } else {
                    // process the intranet url (kml or kmz)
                    if (layer.properties.hasOwnProperty("url")) {
                        let request = {
                            "url": layer.properties.url,
                            xhrFields: {
                                withCredentials: false
                            },
                            beforeSend: function (xhr) {
                                // xhr.overrideMimeType("text/plain; charset=x-user-defined");
                            }
                        }
                        if (layer.properties.hasOwnProperty("credentials")) {
                            if (layer.properties.credentials.hasOwnProperty("required")) {
                                if (ViewUtilities.getBoolean(layer.properties.credentials.required)) {
                                    request.xhrFields.withCredentials = true;
                                }
                            } else if (layer.properties.credentials.hasOwnProperty("token")) {
                                request.url += "&token=" + layer.properties.credentials.token;
                            }
                        }

                        if (layer.params.serviceType === "kml") {
                            // retrieve kml and set it to "data" property
                            if (layer.properties.hasOwnProperty("url")) {
                                if (layer.properties.hasOwnProperty("intranet")) {
                                    if (ViewUtilities.getBoolean(layer.properties.intranet)) {
                                        $.ajax(request)
                                            .done(function (data, textStatus, xhr) {
                                                console.log(data, textStatus);
                                                processKml(data);
                                            })
                                            .fail(function (xhr, textStatus, error) {
                                                console.log(textStatus, error);
                                            });
                                    }
                                } else {

                                }
                            }
                        } else {
                            // retrieve kmz; parse it and store it with "data" property
                            if (layer.properties.hasOwnProperty("url")) {
                                if (layer.properties.hasOwnProperty("intranet")) {
                                } else {

                                }
                            }
                        }
                    }
                }
            };

            parseKml = function (kml) {
                new Promise(function (resolve, reject) {
                    // if kml string is empty; retreive it
                    // parse kml
                    let document = null;

                    if (window.DOMParser) {
                        document = (new DOMParser()).parseFromString(kml, "text/xml");
                    } else if (window.ActiveXObject) {
                        document = new ActiveXObject('Microsoft.XMLDOM');
                        document.async = false;
                        if (!document.loadXML(kml)) {
                            reject("Unable to parse KML string/" + document.parseError.reason + " " + document.parseError.srcText);
                        }
                    } else {
                        reject("Unable to parse KML string/No parser available");
                    }

                    // if error in kml
                    let domError = document.getElementsByTagName("parsererror");
                    if (domError && domError.length > 0) {
                        reject("Unable to parse KML string/parser error, " + domError[0].textContent.trim());
                    }

                    // send the data
                    resolve(document);
                }).then(function (data) {
                    console.log(data);
                    processKml(data);
                }, function (error) {
                    console.log(error);
                });
            };

            processKml = function (node, level, document, folder, id) {
                if (level === undefined) {
                    level = 0;
                } else {
                    level++;
                }

                if ((document === undefined) || (node.nodeName === "Document")) {
                    document = node;
                    if (node.nodeName === "Document") {
                        let tId = getElementId(document);
                        if (id === undefined) {
                            id = tId || new Date().getTime().toString(16);
                        } else {
                            id += "/" + (tId || new Date().getTime().toString(16));
                        }
                    }
                }
                if ((folder === undefined) || (node.nodeName === "Folder")) {
                    folder = node;
                    if (node.nodeName === "Folder") {
                        let tId = getElementId(folder);
                        if (id === undefined) {
                            id = tId || new Date().getTime().toString(16);
                        } else {
                            id += "/" + (tId || new Date().getTime().toString(16));
                        }
                    }
                }

                console.log(level, node.nodeName.padStart((node.nodeName.length + level), '-'), id);

                node = node.firstChild;
                while (node) {
                    if (node.nodeType == 1) {
                        processKml(node, level, document, folder, id);
                    }
                    node = node.nextSibling;
                }
            };

            getElementId = function (node) {
                let result = "";

                $.each(node.children, function (index, child) {
                    if (child.nodeName === "name") {
                        result = child.nodeName;
                        return false;
                    }
                });
                if ((node.id !== undefined) && (node.id !== "")) {
                    result = node.id;

                    return result;
                }
            };

            self.init();
        };

        return ogcKML;
    });