define(["resource/KML2GraphicsLayer", "plugins/ViewUtilities"],
    function (KML2GraphicsLayer, ViewUtilities) {

        let ogcKML = function (global, service) {
            let self = this;
            self.map = global.plugins.extMap.instance;
            self.search = global.plugins.extSearch;
            self.notify = global.plugins.extNotify;
            self.message = global.interfaces.messageService;
            self.overlay = global.plugins.extOverlay;
            self.service = service;
            self.layer = [];
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
                // for each layer, remove the layer
                self.map.removeLayer(self.layer);

                // need to remove any nodes created by the layer
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
                }).then(function (document) {
                    console.log(document);
                    processKml(document);
                }, function (error) {
                    console.log(error);
                });
            };

            processKml = function (document) {
                new Promise(function (resolve, reject) {
                    let layer = new KML2GraphicsLayer(self.service.text, document);
                    resolve(layer);
                }).then(function (layer) {
                    // if zero layer, then error
                    // if one layer, then attach it to map and link events
                    if (layer.kml.count === 0) {
                    } else if (layer.kml.count === 1) {

                    } else {
                        // if more than one layer; then we need to create node for each layer
                        let folders = undefined;
                        $.each(layer.kml, function (index, subLayer) {
                            if (subLayer.hasOwnProperty("folderId")) {
                                folders = subLayer.folderId.split("/");

                                // add new items as serviceType = kml-ready
                                if (folders.length === 1) {
                                    self.overlay.handleAddOverlay({
                                        "name": subLayer.name,
                                        "overlayId": folders[0],
                                        "parentId": service.id
                                    });
                                } else {
                                    self.overlay.handleAddOverlay({
                                        "name": subLayer.name,
                                        "overlayId": folders[folders.length - 1],
                                        "parentId": folders[folders.length - 2]
                                    });
                                }
                            }
                        });
                    }
                }, function (error) {
                    console.log(error);
                });
            };

            self.init();
        };

        return ogcKML;
    });