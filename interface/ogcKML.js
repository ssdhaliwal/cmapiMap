define(["dojo/_base/lang", "resource/KML2GraphicsLayer", 
    "plugins/ViewUtilities", "plugins/JSUtilities"],
    function (lang, KML2GraphicsLayer, ViewUtilities, JSUtilities) {

        let ogcKML = function (global, service) {
            let self = this;
            self.map = global.plugins.extMap.instance;
            self.search = global.plugins.extSearch;
            self.notify = global.plugins.extNotify;
            self.message = global.interfaces.messageService;
            self.layerList = global.plugins.extLayerlist;
            self.datagrid = global.plugins.extDatagrid;
            self.service = service;
            self.layer = null;
            self.selectedFeatures = [];

            self.init = function () {
                console.log("ogcKML - init" );
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
                console.log("ogcKML - handleClick" );
            };

            self.registerEvents = function (layer) {
                console.log("ogcKML - registerEvents" );
            };

            self.remove = function () {
                console.log("ogcKML - remove" );
                console.log("... removed layer: " + self.service.text);

                self.datagrid.removeTab(self);

                // remove all associated graphics layers
                if (self.layer.kml.count === 0) {
                } else {
                    $.each(self.layer.kml, function (index, subLayer) {
                        if (subLayer.graphicsLayer) {
                            self.map.removeLayer(subLayer.graphicsLayer);
                        }
                    });
                }
                /*
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
                console.log("ogcKML - handleClick" );
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
                                if (JSUtilities.getBoolean(layer.properties.credentials.required)) {
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
                                    if (JSUtilities.getBoolean(layer.properties.intranet)) {
                                        $.ajax(request)
                                            .done(function (data, textStatus, xhr) {
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
                console.log("ogcKML - parseKml" );
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
                    processKml(document);
                }, function (error) {
                    console.log(error);
                });
            };

            processKml = function (document) {
                console.log("ogcKML - processKml" );
                new Promise(function (resolve, reject) {
                    let layer = new KML2GraphicsLayer(self.service.text, document, 
                        self.service.layer.properties, self.service.layer.params);
                    resolve(layer);
                }).then(function (layer) {
                    self.layer = layer;

                    // if zero layer, then error
                    // activate all the graphics; user can toggle them via the data grid
                    if (layer.kml.count === 0) {
                    } else {
                        $.each(layer.kml, function (index, subLayer) {
                            if (subLayer.graphicsLayer) {
                                self.map.addLayer(subLayer.graphicsLayer);
                            }
                        });

                        // add to grid via promise
                        new Promise(function (resolve, reject) {
                            resolve(self.layer);
                        }).then(function(layer) {
                            self.datagrid.addTab(self);
                        });
                    }
                    /*
                      else {
                        // if more than one layer; then we need to create node for each layer
                        let folders = undefined;
                        $.each(layer.kml, function (index, subLayer) {
                            if (subLayer.hasOwnProperty("folderId")) {
                                folders = subLayer.folderId.split("/");

                                let prespective = null;
                                if (subLayer.graphicsLayer) {
                                    prespective = subLayer.graphicsLayer;
                                    self.map.addLayer(prespective);
                                }
    
                                if (folders.length === 1) {
                                    self.layerList.handleAddOverlay({
                                        "name": subLayer.name,
                                        "overlayId": folders[0],
                                        "parentId": service.id,
                                        "perspective": prespective
                                    });
                                } else {
                                    self.layerList.handleAddOverlay({
                                        "name": subLayer.name,
                                        "overlayId": folders[folders.length - 1],
                                        "parentId": folders[folders.length - 2],
                                        "perspective": prespective
                                    });
                                }
                            }
                        });
                    }
                    */
                }, function (error) {
                    console.log(error);
                });
            };

            self.init();
        };

        return ogcKML;
    });