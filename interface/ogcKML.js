define(["dojo/_base/lang", "resource/KML2GraphicsLayer", 
    "plugins/ViewUtilities", "plugins/JSUtilities"],
    function (lang, KML2GraphicsLayer, ViewUtilities, JSUtilities) {

        let ogcKML = function (globals,service) {
            let self = this;
            self.map = globals.plugins.extMap.instance;
            self.messageService = globals.interfaces.messageService;
            self.extDatagrid = globals.plugins.extDatagrid;
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

            self.registerEvents = function (layer) {
                console.log("ogcKML - registerEvents" );
            };

            self.remove = function () {
                console.log("ogcKML - remove" );
                console.log("... removed layer: " + self.service.text);

                self.extDatagrid.removeTab(self);

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
                    self.messageService.sendMessage("map.feature.deselected",
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
                            self.extDatagrid.addTab(self);
                        });
                    }
                }, function (error) {
                    console.log(error);
                });
            };

            self.getData = function() {
                console.log("ogcKML - getData" );

                return new Promise(function (resolve, reject) {
                    let layerData = {}, idIndex = 0;
                    layerData.identifier = "id";
                    layerData.items = [];
    
                    if (self.layer.kml.count === 0) {
                    } else {
                        let point = null, item = {};
                        $.each(self.layer.kml, function (index, subLayer) {
                            if (subLayer.graphicsLayer) {
                                // docId, folderId, type, name, graphicsLayer.graphics(attributes/geometry(x/y,paths,rings))
                                console.log(subLayer, subLayer.graphicsLayer);
                                subLayer.graphicsLayer.graphics.forEach(graphic => {
                                    item = {};
                                    if (graphic.geometry.hasOwnProperty("x")) {
                                        item.latitude = graphic.geometry.y;
                                        item.longitude = graphic.geometry.x;
                                    } else if (graphic.geometry.hasOwnProperty("paths")) {
                                        point = graphic.geometry.getExtent().getCenter();
                                        item.latitude = point.y;
                                        item.longitude = point.x;
                                    } else if (graphic.geometry.hasOwnProperty("rings")) {
                                        point = graphic.geometry.getExtent().getCenter();
                                        item.latitude = point.y;
                                        item.longitude = point.x;
                                    } else {
                                        item.latitude = null;
                                        item.longitude = null;
                                    }
    
                                    item.type = graphic.geometry.type;
                                    item.id = (graphic.attributes.id || ('id-' + idIndex++));
                                    item.name = (graphic.attributes.name || graphic.attributes.title || "-");
                                    item.docId = subLayer.docId;
                                    item.folderId = subLayer.folderId;
                                    item.container = subLayer.type;
                                    item.collection = subLayer.name;
    
                                    layerData.items.push(item);
                                });
                            }
                        });
                    }

                    resolve(layerData);
                });
            };

            self.getExtent = function (featureId) {
                console.log("ogcKML - getExtent");

            };

            self.centerOnExtent = function (zoom) {
                console.log("ogcKML - centerOnExtent");

            };

            self.centerOnFeature = function (featureId, zoom) {
                console.log("ogcKML - centerOnFeature");

            };

            self.init();
        };

        return ogcKML;
    });