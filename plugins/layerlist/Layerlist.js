define(["vendor/js/jstree/jstree",
    "interface/esriDynamicMapService", "interface/esriFeatureService", "interface/ogcKML",
    "plugins/ViewUtilities", "plugins/JSUtilities"],
    function (JSTree,
        esriDynamicMapService, esriFeatureService, ogcKML,
        ViewUtilities, JSUtilities) {

        let extLayerlist = function (globals) {
            let self = this;
            self.messageService = globals.interfaces.messageService;
            self.extMap = globals.plugins.extMap;
            self.layerlist = null;
            self.instance = null;
            self.eventPropagation = true;
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
                self.layerlist = $('#layerlistDiv').jstree({
                    "plugins": ["wholerow", "checkbox"],
                    "checkbox": {
                        "keep_selected_style": true,
                        "tie_selection": false,
                        "whole_node": false
                    },
                    'core': {
                        'check_callback': true,
                        'data': {
                            'url': '/esri-cmapi/data/layerlist.json',
                            'data': function (node) {
                                return { 'id': node.id };
                            }
                        }
                    }
                });
                self.instance = $('#layerlistDiv').jstree(true);

                self.registerEvents();
            };

            self.handleClick = function () {
                // console.log("extLayerlist - handleClick" );
                globals.plugins.extToolbar.toggleOptions("#layerlist");

                if ($("#layerlist").hasClass("selected")) {
                    $("#layerlist_wrapper").css("display", "block");
                }
            };

            self.hide = function() {
                // console.log("extLayerlist - hide");

                $("#layerlist").css("display", "none");
            };
            
            self.show = function() {
                // console.log("extLayerlist - show");

                $("#layerlist").css("display", "block");
            };

            self.registerEvents = function () {
                // console.log("extLayerlist - registerEvents" );
                $("#layerlist").on("click", function($event) {
                    // console.log("extLayerlist - registerEvents/click");
                    self.handleClick();
                });

                self.layerlist.on('check_node.jstree', function ($event, data) {
                    // console.log("extLayerlist - registerEvents/check_node.jstree");

                    if (self.eventPropagation) {
                        self.handleShowOverlay({ overlayId: data.node });
                    }
                });

                self.layerlist.on('uncheck_node.jstree', function ($event, data) {
                    // console.log("extLayerlist - registerEvents/uncheck_node.jstree");

                    if (self.eventPropagation) {
                        self.handleHideOverlay({ overlayId: data.node });
                    }
                });

                self.layerlist.on('select_node.jstree', function ($event, data) {
                    // console.log("extLayerlist - registerEvents/select_node.jstree");
                    let length = data.selected.length;
                    for (i = 0, j = length; i < j; i++) {
                        let node = self.instance.get_node(data.selected[i]);
                        // console.log("+ select..." + node.text);

                        let original = node.original;
                        if (original.hasOwnProperty("layer")) {
                            if (original.layer.hasOwnProperty("query") &&
                                JSUtilities.getBoolean(original.layer.query)) {
                                if (original.hasOwnProperty("perspective")) {
                                    original.perspective.remove();
                                    delete original.perspective;
                                }

                                uncheckSelected(node, false);
                                self.discoverLayers(node);
                            }
                        }
                    }
                });

                self.layerlist.on('deselect_node.jstree', function ($event, data) {
                    // console.log("extLayerlist - registerEvents/deselect_node.jstree");
                    let length = data.selected.length;
                    for (i = 0, j = length; i < j; i++) {
                        let node = self.instance.get_node(data.selected[i]);
                        // console.log("+ deselect..." + node.text);
                    }
                });
            };

            self.discoverLayers = function (node, parent) {
                // console.log("extLayerlist - discoverLayers" );
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
                            if (JSUtilities.getBoolean(original.layer.properties.credentials.required)) {
                                request.xhrFields.withCredentials = true;
                            }
                        } else if (original.layer.properties.credentials.hasOwnProperty("token")) {
                            request.url += "&token=" + original.layer.properties.credentials.token;
                        }
                    }

                    $.ajax(request).done(function (data) {
                        // try to parse json if not parsed (some types json is returned as a string?)
                        data = JSUtilities.tryJSONParse(data);

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
                                        layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/DMS-Query.png";

                                        let id = $('#layerlistDiv').jstree('create_node', pnode.id, layerCopy, 'last', false);
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
                                            layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/DMS.png";

                                            let id = $('#layerlistDiv').jstree('create_node', parent.id, layerCopy, 'last', false);
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
                                                layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/FS.png";
                                                layerCopy.layer.params.serviceType = "feature";
                                            }
                                            layerCopy.layer.properties.url = original.layer.properties.url + "/" + value.id;
                                            layerCopy.layer.query = false;

                                            let id = $('#layerlistDiv').jstree('create_node', parent.id, layerCopy, 'last', false);
                                        }
                                    });
                                }
                            }
                        } catch (exception) {
                            let payload = { "type": "map.overlay.*", "msg": "user click on query overlay", "error": exception };
                            self.messageService.sendMessage("map.error", JSON.stringify(payload));
                        }
                    });
                }
            };

            self.handleRenderService = function (node) {
                // console.log("extLayerlist - handleRenderService" );

                let service, parentNode;

                service = node.original;
                service.parentId = self.instance.get_parent(node);
                parentNode = self.instance.get_node(service.parentId);
                service.parentText = parentNode.text;

                // console.log("... render service!!", service.parentId, service.parentText, service);

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
                                service.perspective = new esriDynamicMapService(globals,service);
                            } else if (service.layer.params.serviceType === "feature") {
                                service.perspective = new esriFeatureService(globals,service);
                            } else if ((service.layer.params.serviceType === "kml") ||
                                (service.layer.params.serviceType === "kmz")) {
                                // if properties has data or property has local = true with url
                                if (service.layer.hasOwnProperty("properties")) {
                                    if (service.layer.properties.hasOwnProperty("data") ||
                                        (service.layer.properties.hasOwnProperty("url") &&
                                            service.layer.properties.hasOwnProperty("intranet"))) {
                                        service.perspective = new ogcKML(globals,service);
                                    } else {
                                        // service.perspective = new esriKMLervice(globals,service);
                                    }
                                }
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

            checkSelected = function (nodeId, propagation) {
                // console.log("extLayerlist - checkSelected" );
                let node = self.instance.get_node(nodeId);
                
                self.eventPropagation = propagation;
                self.instance.check_node(node);
                self.eventPropagation = true;
            };

            uncheckSelected = function (nodeId, propagation) {
                // console.log("extLayerlist - uncheckSelected" );
                let node = self.instance.get_node(nodeId);

                self.eventPropagation = propagation;
                self.instance.uncheck_node(node);
                self.eventPropagation = true;
            };

            changeNodeStatus = function (nodeId, status) {
                // console.log("extLayerlist - changeNodeStatus" );
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
                    // console.log("^ clearing..." + cnode.text, cnode.original);
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
                // console.log("extLayerlist - handleAddOverlay" );
                // get USER FAVORITES node and add new items as child nodes
                let pNode = self.instance.get_node(self.defaultOverlayId);
                if (request.hasOwnProperty("parentId")) {
                    let cNode = self.instance.get_node(request.parentId);
                    if (JSUtilities.getBoolean(cNode)) {
                        pNode = cNode;
                    }
                }

                // check if node already exists; if yes - ignore
                let oNode = self.instance.get_node(request.overlayId);
                if (!JSUtilities.getBoolean(oNode)) {
                    let nNode = {
                        "id": request.overlayId,
                        "text": request.name,
                        "icon": "",
                        "state": {
                            "opened": false,
                            "disabled": false,
                            "selected": true
                        }
                    };

                    if (request.perspective) {
                        nNode.original = {
                            perspective: request.perspective
                        };
                    }

                    let nId = $('#layerlistDiv').jstree('create_node', pNode.id, nNode, 'last', false);
                } else {
                    if ((oNode.text !== request.name) || request.hasOwnProperty("parentId")) {
                        let oId = oNode.id;
                        if (oNode.text !== request.name) {
                            oNode.text = request.name;
                            oNode.original.text = request.name;

                            $('#layerlistDiv').jstree('rename_node', oNode.id, oNode.text);
                        }

                        if (request.perspective) {
                            if (!oNode.original) {
                                oNode.original = {};
                            }
                            oNode.original = {
                                perspective: request.perspective
                            };
                        }
    
                        // if parent id is provided; move the node
                        if (request.hasOwnProperty("parentId")) {
                            $('#layerlistDiv').jstree('move_node', oNode, pNode.id, 'last', false);
                        }
                    } else {
                        let payload = { "type": "map.overlay.create", "msg": request, "error": "duplicate overlay, already exists!" };
                        self.messageService.sendMessage("map.error", JSON.stringify(payload));
                    }
                }
            };

            self.handleRemoveOverlay = function (request) {
                // console.log("extLayerlist - handleRemoveOverlay" );
                // get USER FAVORITES node and remove items from child nodes
                let oNode = $("#layerlistDiv").jstree().get_node(request.overlayId);
                if (JSUtilities.getBoolean(oNode)) {
                    let pId = oNode.id;

                    // uncheck and remove the layers from map
                    uncheckSelected(pId, false);
                    $("#layerlistDiv").jstree("delete_node", $("#" + pId));
                }
            };

            self.handleHideOverlay = function (request) {
                // console.log("extLayerlist - handleHideOverlay" );
                // get USER FAVORITES node and remove items from child nodes
                let node = self.instance.get_node(request.overlayId);
                if (JSUtilities.getBoolean(node)) {
                    let pId = node.id;

                    // uncheck and remove the layers from map
                    uncheckSelected(pId, false);
                    let original = node.original;

                    // console.log("^ unchecked..." + node.text, original);
                    changeNodeStatus(node, "enable");

                    // console.log("^ clearing..." + node.text, node, original.perspective);
                    if (original.hasOwnProperty("perspective")) {
                        original.perspective.remove();
                        delete original.perspective;
                    }
                }
            };

            self.handleShowOverlay = function (request) {
                // console.log("extLayerlist - handleShowOverlay" );
                // get USER FAVORITES node and remove items from child nodes
                let node = self.instance.get_node(request.overlayId);
                if (JSUtilities.getBoolean(node)) {
                    let original = node.original;

                    checkSelected(node.id, false);
                    if (node.children.length === 0) {
                        // console.log("^ checked..." + node.text, original);

                        if (!original.hasOwnProperty("perspective")) {
                            self.handleRenderService(node);
                        }
                    } else {
                        showOverlayChildren(node);
                    }
                }
            };

            showOverlayChildren = function(node) {
                let original = node.original;

                // console.log("^ checked..." + node.text, original);

                // if the node has a layer (dynamic layer?)
                if (original.hasOwnProperty("layer")) {
                    changeNodeStatus(node, "disable");
                    if (!original.hasOwnProperty("perspective")) {
                        self.handleRenderService(node);
                    }
                } else {
                    // loop and activate all nodes with layers
                    let cnode;
                    node.children.forEach(function (child_id) {
                        cnode = self.instance.get_node(child_id);
                        showOverlayChildren(cnode);
                    });
                }
            };

            self.handlePlotFeatureUrl = function (request) {
                // console.log("extLayerlist - handlePlotFeatureUrl" );
                // create the overlay if not existing
                if (request.hasOwnProperty("overlayId") && !JSUtilities.isEmpty(request.overlayId)) {
                    self.messageService.cmapiAdapter.onMapOverlayCreate({ overlayId: request.overlayId });
                }

                // check if feature id already exists
                let oNode = self.instance.get_node(request.featureId);
                if (!JSUtilities.getBoolean(oNode)) {
                    // create layer payload
                    let layerCopy = {
                        "id": request.featureId,
                        "text": request.name,
                        "icon": "/esri-cmapi/plugins/layerlist/icons/KML.png",
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

                    // add the layer to the layerlist
                    switch (layerCopy.layer.params.serviceType) {
                        case "dynamic":
                            layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/DMS.png";
                            if (layerCopy.layer.hasOwnProperty("query") && JSUtilities.getBoolean(layerCopy.layer.query)) {
                                layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/DMS-Query.png";
                            }
                            layerCopy.layer.params.serviceType = "dynamic";
                            break;
                        case "feature":
                            layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/FS.png";
                            layerCopy.layer.params.serviceType = "feature";
                            break;
                        case "wms":
                            layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/WMS.png";
                            layerCopy.layer.params.serviceType = "wms";
                            break;
                        case "kml":
                            layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/KML.png";
                            layerCopy.layer.params.serviceType = "kml";
                            break;
                        case "kmz":
                            layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/KMZ.png";
                            layerCopy.layer.params.serviceType = "kmz";
                            break;
                        case "image":
                            layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/ISL.png";
                            layerCopy.layer.params.serviceType = "image";
                            break;
                    }

                    let overlayId = request.overlayId || self.defaultOverlayId;
                    let pNode = self.instance.get_node(overlayId);
                    // console.log(layerCopy);

                    let id = $('#layerlistDiv').jstree('create_node', pNode.id, layerCopy, 'last', false);
                    self.handleShowOverlay({overlayId: id});
                }
            };

            findOverlayFeatures = function(overlayId, features) {
                // console.log("extLayerlist - findOverlayFeatures" );
                let node = self.instance.get_node(overlayId);
                let cnode, original;

                if (node.children.length > 0) {
                    node.children.forEach(function (child_id) {
                        cnode = self.instance.get_node(child_id);
                        if (cnode.children.length > 0) {
                            findOverlayFeatures(child_id, features);
                        } else {
                            features.push(cnode);
                        }
                    });
                } else {
                    features.push(node);
                }

                return features;
            };

            self.handleCenterOverlay = function(overlayId, zoom) {
                // console.log("extLayerlist - handleCenterOverlay" );

                // find overlayId; if it is has prespective, then we are good; else return error
                // check if node already exists; if yes - ignore
                let oNode = self.instance.get_node(overlayId);
                if (JSUtilities.getBoolean(oNode)) {
                    // get all the features for overlay on map
                    let features = findOverlayFeatures(oNode, []);
                    // console.log(features);

                    // loop through and collect the extent for all published features
                    let extent;
                    features.forEach((feature) => {
                        if (feature.original && feature.original.layer && feature.original.perspective) {
                            extent = ViewUtilities.unionExtents(feature.original.perspective.getExtent(), extent);
                        }
                    });

                    if(extent) {
                        if (!JSUtilities.getBoolean(zoom) || (zoom === "auto")) {
                            self.extMap.handleSetExtent(extent, true);
                        } else {
                            self.extMap.handleCenterLocationPoint(extent.getCenter());
                        }
                    }
                }
            };

            self.handleCenterFeature = function(featureId, markerId, zoom) {
                // console.log("extLayerlist - handleCenterFeature" );

                // find featureId; if exists, good; else return error
                let feature = self.instance.get_node(featureId);
                if (JSUtilities.getBoolean(feature)) {
                    // console.log(feature);

                    // if not doing by markerId, then we handle layer extent
                    if (!markerId) {
                        if (feature.original && feature.original.layer && feature.original.perspective) {
                            feature.original.perspective.centerOnExtent(markerId, zoom);
                        }
                    } else {
                        // if feature layer, we need to do a query...; if local, then we need to search
                        // push the execution to the layer itself...
                    }
                }
            };

            self.handleClearAll = function() {
                // console.log("extLayerlist - handleClearAll" );

                // loop through the layerlist and clear all checked items from map
            };

            self.init();
        };

        return extLayerlist;
    });