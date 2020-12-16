define(["vendor/js/jstree/jstree", "interface/esriDynamicMapService", "interface/esriFeatureService"],
    function (JSTree, esriDynamicMapService, esriFeatureService) {

        let extLayerlist = function (global) {
            let self = this;
            let map = global.plugins.extMap.map;
            self.layerlist = null;
            self.instance = null;
            self.layers = [];

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
                global.plugins.extToolbar.toggleOptions("#layerlist");

                if ($("#layerlist").hasClass("selected")) {
                    $("#layerlist_wrapper").css("display", "block");
                }
            };

            self.registerEvents = function () {
                $("#layerlist").on("click", self.handleClick);

                self.layerlist.on('check_node.jstree', function (e, data) {
                    let length = data.selected.length;
                    for (i = 0, j = length; i < j; i++) {
                        let node = data.instance.get_node(data.selected[i]);
                        let original = node.original;

                        let parentId, parentNode, parentText;
                        if (node.children.length === 0) {
                            console.log("^ checked..." + node.text, original);

                            if (!original.hasOwnProperty("perspective")) {
                                parentId = data.instance.get_parent(node);
                                parentNode = data.instance.get_node(parentId);
                                parentText = parentNode.text;

                                self.addService(parentId, parentText, original);
                            }
                        } else {
                            if (node.children.length > 0) {
                                console.log("^ checked..." + node.text, original);
                                changeNodeStatus(data.selected[i], "disable");
                                if (!original.hasOwnProperty("perspective")) {
                                    parentId = data.instance.get_parent(node);
                                    parentNode = data.instance.get_node(parentId);
                                    parentText = parentNode.text;
                                    
                                    self.addService(parentId, parentText, original);
                                }
                            }
                        }
                    }
                });

                self.layerlist.on('uncheck_node.jstree', function (e, data) {
                    let node = data.instance.get_node(data.node.a_attr.id);
                    let original = node.original;

                    console.log("^ unchecked..." + node.text, original);
                    changeNodeStatus(node, "enable");

                    console.log("^ clearing..." + node.text, node.original);
                    if (original.hasOwnProperty("perspective")) {
                        original.perspective.remove();
                        delete original.perspective;
                    }
                });

                self.layerlist.on('select_node.jstree', function (e, data) {
                    let length = data.selected.length;
                    for (i = 0, j = length; i < j; i++) {
                        let node = data.instance.get_node(data.selected[i]);
                        console.log("+ select..." + node.text);

                        let original = node.original;
                        if (original.hasOwnProperty("layer")) {
                            if (original.layer.hasOwnProperty("query") &&
                                ((original.layer.query || false) === true)) {
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

                self.layerlist.on('deselect_node.jstree', function (e, data) {
                    let length = data.selected.length;
                    for (i = 0, j = length; i < j; i++) {
                        let node = data.instance.get_node(data.selected[i]);
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
                            if (original.layer.properties.credentials.required === true) {
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
                                        layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/DMS-Query.png";

                                        let id = $('#layerlistDiv').jstree('create_node', $("#" + pnode.a_attr.id), layerCopy, 'last', false, false);
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
                                                        parent = $('#layerlistDiv').jstree().get_node(pValue.id);
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

                                            let id = $('#layerlistDiv').jstree('create_node', $("#" + parent.a_attr.id), layerCopy, 'last', false, false);
                                            newNodes[value.id] = { "id": id, "parent": parent, "subLayers": value.subLayers };
                                        } else {
                                            $.each(newNodes, function (pIndex, pValue) {
                                                $.each(pValue.subLayers, function (subIndex, subValue) {
                                                    if (subValue.id === value.id) {
                                                        parent = $('#layerlistDiv').jstree().get_node(pValue.id);
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

                                            let id = $('#layerlistDiv').jstree('create_node', $("#" + parent.a_attr.id), layerCopy, 'last', false, false);
                                        }
                                    });
                                }
                            }
                        } catch (exception) {
                            console.log(exception);
                        }
                    });
                }
            };

            self.addService = function (overlayId, overlayText, service) {
                console.log("... add service!!", overlayId, overlayText, service);

                service.overlayId = overlayId;
                service.overlayText = overlayText;

                if (service.layer.hasOwnProperty("params")) {
                    if (service.layer.params.hasOwnProperty("serviceType")) {
                        if (service.layer.params.serviceType === "dynamic") {
                            service.perspective = new esriDynamicMapService(global, service);
                        } else if (service.layer.params.serviceType === "feature") {
                            service.perspective = new esriFeatureService(global, service);
                        } else if (service.layer.params.serviceType === "kml") {
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
            };

            uncheckSelected = function (nodeId) {
                let node = $("#layerlistDiv").jstree().get_node(nodeId);
                $("#layerlistDiv").jstree().uncheck_node(node);
            };

            changeNodeStatus = function (nodeId, status) {
                let node = $("#layerlistDiv").jstree().get_node(nodeId);
                let cnode, original;
                node.children.forEach(function (child_id) {
                    cnode = $("#layerlistDiv").jstree().get_node(child_id);
                    if (status === 'enable') {
                        $("#layerlistDiv").jstree().enable_node(cnode);
                    } else {
                        $("#layerlistDiv").jstree().disable_node(cnode);
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

            self.addOverlay = function (overlayId, overlay) {
                // get USER FAVORITES node and add new items as child nodes
            };

            self.removeOverlay = function(overlayId) {
                // get USER FAVORITES node and remove items from child nodes
            };

            self.addLayers = function (layers) {
                layers.forEach(element => {
                    console.log(element);
                    self.layers.push(element);
                });

                console.log(layers, self.layers);
            };

            self.init();
        };

        return extLayerlist;
    });