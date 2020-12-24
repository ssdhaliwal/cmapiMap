define(["vendor/js/jstree/jstree",
    "interface/esriDynamicMapService", "interface/esriFeatureService", "interface/ogcKML",
    "plugins/ViewUtilities"],
    function (JSTree,
        esriDynamicMapService, esriFeatureService, ogcKML,
        ViewUtilities) {

        let extOverlay = function (global) {
            let self = this;
            self.message = global.interfaces.messageService;
            self.overlay = null;
            self.instance = null;
            self.layers = [];
            self.defaultOverlayId = "USER1001";
            self.defaultParams = {
                "format": "image/png",
                "refreshInterval": "10",
                "zoom": "false",
                "showLabels": "false",
                "opacity": "0.50",
                "transparent": "true",
                "useProxy": "false"
            };

            self.init = function () {
                self.overlay = $('#overlayDiv').jstree({
                    "plugins": ["wholerow", "checkbox"],
                    "checkbox": {
                        "keep_selected_style": true,
                        "tie_selection": false,
                        "whole_node": false
                    },
                    'core': {
                        'check_callback': true,
                        'data': {
                            'url': '/esri-cmapi/data/overlay.json',
                            'data': function (node) {
                                return { 'id': node.id };
                            }
                        }
                    }
                });
                self.instance = $('#overlayDiv').jstree(true);

                self.registerEvents();
            };

            self.handleClick = function () {
                global.plugins.extToolbar.toggleOptions("#overlay");

                if ($("#overlay").hasClass("selected")) {
                    $("#overlay_wrapper").css("display", "block");
                }
            };

            self.registerEvents = function () {
                $("#overlay").on("click", self.handleClick);

                self.overlay.on('check_node.jstree', function (e, data) {
                    self.handleShowOverlay({ overlayId: data.node });
                });

                self.overlay.on('uncheck_node.jstree', function (e, data) {
                    self.handleHideOverlay({ overlayId: data.node });
                });

                self.overlay.on('select_node.jstree', function (e, data) {
                    let length = data.selected.length;
                    for (i = 0, j = length; i < j; i++) {
                        let node = self.instance.get_node(data.selected[i]);
                        console.log("+ select..." + node.text);

                        let original = node.original;
                        if (original.hasOwnProperty("layer")) {
                            if (original.layer.hasOwnProperty("query") &&
                                ViewUtilities.getBoolean(original.layer.query)) {
                                if (original.hasOwnProperty("perspective")) {
                                    original.perspective.remove();
                                    delete original.perspective;
                                }

                                uncheckSelected(node);
                                self.discoverLayers(node);
                            }
                        }
                    }
                });

                self.overlay.on('deselect_node.jstree', function (e, data) {
                    let length = data.selected.length;
                    for (i = 0, j = length; i < j; i++) {
                        let node = self.instance.get_node(data.selected[i]);
                        console.log("+ deselect..." + node.text);
                    }
                });
            };

            self.discoverLayers = function (node, parent) {
                let original = node.original;
                let pnode = (parent || node);

                if (!original.layer.hasOwnProperty("subLayers")) {
                    original.layer.query = false;
                    original.layer.subLayers = [];

                    let request = {
                        "url": original.layer.properties.url + "Layers/?f=pjson",
                        xhrFields: {
                            withCredentials: false
                        },
                        beforeSend: function (xhr) {
                            // xhr.overrideMimeType("text/plain; charset=x-user-defined");
                        }
                    }
                    if (original.layer.properties.hasOwnProperty("credentials")) {
                        if (original.layer.properties.credentials.hasOwnProperty("required")) {
                            if (ViewUtilities.getBoolean(original.layer.properties.credentials.required)) {
                                request.xhrFields.withCredentials = true;
                            }
                        } else if (original.layer.properties.credentials.hasOwnProperty("token")) {
                            request.url += "&token=" + original.layer.properties.credentials.token;
                        }
                    }

                    $.ajax(request).done(function (data) {
                        // try to parse json if not parsed (some types json is returned as a string?)
                        data = ViewUtilities.tryJSONParse(data);

                        // is multiple layers; check if sub-layers is present
                        // if yes, then add them as dynamic layers
                        // if no, as them as feature layers
                        try {
                            if (data.hasOwnProperty("subLayers")) {
                                if (data.subLayers.length > 0) {
                                    $.each(data.subLayers, function (index, value) {
                                        original.layer.subLayers.push({ id: value.id, name: value.name });

                                        let layerCopy = JSON.parse(JSON.stringify(original));
                                        delete layerCopy.layer.query;
                                        delete layerCopy.layer.subLayers;

                                        layerCopy.id = original.id + "-" + value.id;
                                        layerCopy.text = value.name;
                                        layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/DMS-Query.png";

                                        let id = $('#overlayDiv').jstree('create_node', pnode.id, layerCopy, 'last', false);
                                    });
                                }
                            } else {
                                if (data.layers.length > 0) {
                                    let newValues = {}, newNodes = {}, newMarked = [];
                                    $.each(data.layers, function (index, value) {
                                        newValues[value.id] = value;
                                    });

                                    let parent = pnode;
                                    $.each(newValues, function (index, value) {
                                        if (value.hasOwnProperty("subLayers") && (value.subLayers.length > 0)) {
                                            // set parent
                                            $.each(newNodes, function (pIndex, pValue) {
                                                $.each(pValue.subLayers, function (subIndex, subValue) {
                                                    if (subValue.id === value.id) {
                                                        parent = self.instance.get_node(pValue.id);
                                                    }
                                                });
                                            });
                                            original.layer.subLayers.push({ id: value.id, name: value.name });

                                            let layerCopy = JSON.parse(JSON.stringify(original));
                                            delete layerCopy.layer.query;
                                            delete layerCopy.layer.subLayers;

                                            layerCopy.id = original.id + "-" + value.id;
                                            layerCopy.text = value.name;
                                            layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/DMS.png";

                                            let id = $('#overlayDiv').jstree('create_node', parent.id, layerCopy, 'last', false);
                                            newNodes[value.id] = { "id": id, "parent": parent, "subLayers": value.subLayers };
                                        } else {
                                            $.each(newNodes, function (pIndex, pValue) {
                                                $.each(pValue.subLayers, function (subIndex, subValue) {
                                                    if (subValue.id === value.id) {
                                                        parent = self.instance.get_node(pValue.id);
                                                    }
                                                });
                                            });

                                            original.layer.subLayers.push({ id: value.id, name: value.name });

                                            let layerCopy = JSON.parse(JSON.stringify(original));
                                            delete layerCopy.layer.query;
                                            delete layerCopy.layer.subLayers;

                                            layerCopy.id = original.id + "-" + value.id;
                                            layerCopy.text = value.name;
                                            if (value.type === "Feature Layer") {
                                                layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/FS.png";
                                                layerCopy.layer.params.serviceType = "feature";
                                            }
                                            layerCopy.layer.properties.url = original.layer.properties.url + "/" + value.id;
                                            layerCopy.layer.query = false;

                                            let id = $('#overlayDiv').jstree('create_node', parent.id, layerCopy, 'last', false);
                                        }
                                    });
                                }
                            }
                        } catch (exception) {
                            let payload = { "type": "map.overlay.*", "msg": "user click on query overlay", "error": exception };
                            self.message.sendMessage("map.error", JSON.stringify(payload));
                        }
                    });
                }
            };

            self.handleRenderService = function (parentId, parentText, service) {
                console.log("... render service!!", parentId, parentText, service);

                service.parentId = parentId;
                service.parentText = parentText;

                // add default params to service if not present
                if (service.hasOwnProperty("layer")) {
                    if (service.layer.hasOwnProperty("params")) {
                        $.each(self.defaultParams, function (index, value) {
                            if (!service.layer.params.hasOwnProperty(index)) {
                                service.layer.params[index] = value;
                            }
                        });

                        if (service.layer.params.hasOwnProperty("serviceType")) {
                            if (service.layer.params.serviceType === "dynamic") {
                                service.perspective = new esriDynamicMapService(global, service);
                            } else if (service.layer.params.serviceType === "feature") {
                                service.perspective = new esriFeatureService(global, service);
                            } else if ((service.layer.params.serviceType === "kml") ||
                                (service.layer.params.serviceType === "kmz")) {
                                // if properties has data or property has local = true with url
                                if (service.layer.hasOwnProperty("properties")) {
                                    if (service.layer.properties.hasOwnProperty("data") ||
                                        service.layer.properties.hasOwnProperty("restricted")) {
                                        service.perspective = new ogcKML(global, service);
                                    } else {
                                        // service.perspective = new esriKMLervice(global, service);
                                    }
                                }
                            } else if (service.layer.params.serviceType === "kml-ready") {
                            } else if (service.layer.params.serviceType === "wms") {
                            } else if (service.layer.params.serviceType === "tiles") {
                            } else if (service.layer.params.serviceType === "image") {
                            } else if (service.layer.params.serviceType === "csv") {
                            } else if (service.layer.params.serviceType === "raster") {
                            } else if (service.layer.params.serviceType === "vectorTile") {
                            } else if (service.layer.params.serviceType === "webmap") {
                            } else if (service.layer.params.serviceType === "vectorImage") {
                            } else if (service.layer.params.serviceType === "stream") {
                            } else if (service.layer.params.serviceType === "wcs") {
                            } else if (service.layer.params.serviceType === "wcf") {
                            } else if (service.layer.params.serviceType === "geoJson") {
                            }
                        }
                    }
                }
            };

            checkSelected = function (nodeId) {
                let node = self.instance.get_node(nodeId);
                self.instance.check_node(node);
            };

            uncheckSelected = function (nodeId) {
                let node = self.instance.get_node(nodeId);
                self.instance.uncheck_node(node);
            };

            changeNodeStatus = function (nodeId, status) {
                let node = self.instance.get_node(nodeId);
                let cnode, original;
                node.children.forEach(function (child_id) {
                    cnode = self.instance.get_node(child_id);
                    if (status === 'enable') {
                        self.instance.enable_node(cnode);
                    } else {
                        self.instance.disable_node(cnode);
                    }

                    original = cnode.original;
                    console.log("^ clearing..." + cnode.text, cnode.original);
                    if (original.hasOwnProperty("perspective")) {
                        original.perspective.remove();
                        delete original.perspective;
                    }

                    if (cnode.children.length > 0) {
                        changeNodeStatus(child_id, status);
                    }
                });
            };

            self.handleAddOverlay = function (request) {
                // get USER FAVORITES node and add new items as child nodes
                let pNode = self.instance.get_node(self.defaultOverlayId);
                if (request.hasOwnProperty("parentId")) {
                    let cNode = self.instance.get_node(request.parentId);
                    if (ViewUtilities.getBoolean(cNode)) {
                        pNode = cNode;
                    }
                }

                // check if node already exists; if yes - ignore
                let oNode = self.instance.get_node(request.overlayId);
                if (!ViewUtilities.getBoolean(oNode)) {
                    let nNode = {
                        "id": request.overlayId,
                        "text": request.name,
                        "icon": "",
                        "state": {
                            "opened": false,
                            "disabled": false,
                            "selected": false
                        }
                    };

                    let nId = $('#overlayDiv').jstree('create_node', pNode.id, nNode, 'last', false);
                } else {
                    if ((oNode.text !== request.name) || request.hasOwnProperty("parentId")) {
                        let oId = oNode.id;
                        if (oNode.text !== request.name) {
                            oNode.text = request.name;
                            oNode.original.text = request.name;

                            $('#overlayDiv').jstree('rename_node', oNode.id, oNode.text);
                        }

                        // if parent id is provided; move the node
                        if (request.hasOwnProperty("parentId")) {
                            $('#overlayDiv').jstree('move_node', oNode, pNode.id, 'last', false);
                        }
                    } else {
                        let payload = { "type": "map.overlay.create", "msg": request, "error": "duplicate overlay, already exists!" };
                        self.message.sendMessage("map.error", JSON.stringify(payload));
                    }
                }
            };

            self.handleRemoveOverlay = function (request) {
                // get USER FAVORITES node and remove items from child nodes
                let oNode = $("#overlayDiv").jstree().get_node(request.overlayId);
                if (ViewUtilities.getBoolean(oNode)) {
                    let pId = oNode.id;

                    // uncheck and remove the layers from map
                    uncheckSelected(pId);
                    $("#overlayDiv").jstree("delete_node", $("#" + pId));
                }
            };

            self.handleHideOverlay = function (request) {
                // get USER FAVORITES node and remove items from child nodes
                let node = self.instance.get_node(request.overlayId);
                if (ViewUtilities.getBoolean(node)) {
                    let pId = node.id;

                    // uncheck and remove the layers from map
                    uncheckSelected(pId);
                    let original = node.original;

                    console.log("^ unchecked..." + node.text, original);
                    changeNodeStatus(node, "enable");

                    console.log("^ clearing..." + node.text, node.original);
                    if (original.hasOwnProperty("perspective")) {
                        original.perspective.remove();
                        delete original.perspective;
                    }
                }
            };

            self.handleShowOverlay = function (request) {
                // get USER FAVORITES node and remove items from child nodes
                let node = self.instance.get_node(request.overlayId);
                if (ViewUtilities.getBoolean(node)) {
                    let original = node.original;

                    let parentId, parentNode, parentText;
                    checkSelected(node.id);
                    if (node.children.length === 0) {
                        console.log("^ checked..." + node.text, original);

                        if (!original.hasOwnProperty("perspective")) {
                            parentId = self.instance.get_parent(node);
                            parentNode = self.instance.get_node(parentId);
                            parentText = parentNode.text;

                            self.handleRenderService(parentId, parentText, original);
                        }
                    } else {
                        if (node.children.length > 0) {
                            console.log("^ checked..." + node.text, original);
                            changeNodeStatus(node, "disable");
                            if (!original.hasOwnProperty("perspective")) {
                                parentId = self.instance.get_parent(node);
                                parentNode = self.instance.get_node(parentId);
                                parentText = parentNode.text;

                                self.handleRenderService(parentId, parentText, original);
                            }
                        }
                    }
                }
            };

            self.handlePlotFeatureUrl = function (request) {
                // create the overlay if not existing
                if (request.hasOwnProperty("overlayId") && !ViewUtilities.isEmpty(request.overlayId)) {
                    global.interfaces.messageService.cmapiAdapter.onMapOverlayCreateUpdate({ overlayId: request.overlayId });
                }

                // check if feature id already exists
                let oNode = self.instance.get_node(request.featureId);
                if (!ViewUtilities.getBoolean(oNode)) {
                    // create layer payload
                    let layerCopy = {
                        "id": request.featureId,
                        "text": request.name,
                        "icon": "/esri-cmapi/plugins/overlay/icons/KML.png",
                        "layer": {
                            "properties": {
                                "url": request.url,
                                "credentials": {
                                    "required": false,
                                    "token": ""
                                }
                            },
                            "params": {
                                "serviceType": "kml"
                            }
                        }
                    };

                    // add param overrides & custom properties
                    $.each(request.params, function (index, value) {
                        layerCopy.layer.params[index] = value;
                    });
                    $.each(request.properties, function (index, value) {
                        layerCopy.layer.properties[index] = value;
                    });

                    // add the layer to the overlay
                    switch (layerCopy.layer.params.serviceType) {
                        case "dynamic":
                            layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/DMS.png";
                            if (layerCopy.layer.hasOwnProperty("query") && ViewUtilities.getBoolean(layerCopy.layer.query)) {
                                layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/DMS-Query.png";
                            }
                            layerCopy.layer.params.serviceType = "dynamic";
                            break;
                        case "feature":
                            layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/FS.png";
                            layerCopy.layer.params.serviceType = "feature";
                            break;
                        case "wms":
                            layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/WMS.png";
                            layerCopy.layer.params.serviceType = "wms";
                            break;
                        case "kml":
                            layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/KML.png";
                            layerCopy.layer.params.serviceType = "kml";
                            break;
                        case "kml-ready":
                            layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/KML-Ready.png";
                            layerCopy.layer.params.serviceType = "kml-ready";
                            break;
                        case "kmz":
                            layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/KMZ.png";
                            layerCopy.layer.params.serviceType = "kmz";
                            break;
                        case "image":
                            layerCopy.icon = "/esri-cmapi/plugins/overlay/icons/ISL.png";
                            layerCopy.layer.params.serviceType = "image";
                            break;
                    }

                    let overlayId = request.overlayId || self.defaultOverlayId;
                    let pNode = self.instance.get_node(overlayId);
                    console.log(layerCopy);
                    let id = $('#overlayDiv').jstree('create_node', pNode.id, layerCopy, 'last', false);
                }
            };

            self.init();
        };

        return extOverlay;
    });