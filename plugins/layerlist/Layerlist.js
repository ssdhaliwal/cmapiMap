define(["vendor/js/jstree/jstree", "interface/esriDynamicMapService"],
    function (JSTree, esriDynamicMapService) {

        let extLayerlist = function (global) {
            let self = this;
            let map = global.plugins.extMap.map;
            let search = global.plugins.extSearch;
            let notify = global.plugins.extNotify;
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
                        if (node.children.length === 0) {
                            console.log("^ checked..." + node.text, original);

                            if (!original.hasOwnProperty("perspective")) {
                                self.addService(original);
                            }
                        } else {
                            if (node.children.length > 0) {
                                console.log("^ ignore/remove..." + node.text, original);
                                if (original.hasOwnProperty("perspective")) {
                                    original.perspective.remove();
                                    delete original.perspective;
                                }

                                for (c = 0; c < node.children.length; c++) {
                                    let cnode = data.instance.get_node(node.children[c]);
                                    original = cnode.original;
                                    console.log("^ checked..." + cnode.text, cnode.original);
                                    if (!original.hasOwnProperty("perspective")) {
                                        self.addService(original);
                                    }
                                }
                            }
                        }
                    }
                });

                self.layerlist.on('uncheck_node.jstree', function (e, data) {
                    let node = data.instance.get_node(data.node.a_attr.id);
                    let original = node.original;

                    console.log("^ unchecked..." + node.text, original);
                    if (original.hasOwnProperty("perspective")) {
                        original.perspective.remove();
                        delete original.perspective;

                        if (node.children.length > 0) {
                            let length = data.children.length;
                            for (c = 0; c < length; c++) {
                                let cnode = data.instance.get_node(node.children[c]);
                                original = cnode.original;
                                console.log("^ unchecked..." + cnode.text, cnode.original);
                                if (!original.hasOwnProperty("perspective")) {
                                    original.perspective.remove();
                                    delete original.perspective;
                                }
                            }
                        }
                    }
                });

                self.layerlist.on('select_node.jstree', function (e, data) {
                    let length = data.selected.length;
                    for (i = 0, j = length; i < j; i++) {
                        let node = data.instance.get_node(data.selected[i]);
                        console.log("+ select..." + node.text);

                        let original = node.original;
                        if (original.layer.hasOwnProperty("query") &&
                            ((original.layer.query || false) === true)) {
                            node.state.selected = false;
                            self.discoverLayers(node);
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
                        "url": original.layer.properties.url + "/Layers/?f=pjson",
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
                        // is multiple layers; check if sub-layers is present
                        // if yes, then add them as dynamic layers
                        // if no, as them as feature layers
                        try {
                            if (data.hasOwnProperty("subLayers")) {
                                if (data.subLayers.length > 0) {
                                    console.log("... adding sublayers");
                                    $.each(data.subLayers, function (index, value) {
                                        original.layer.subLayers.push({ id: value.id, name: value.name });

                                        let layerCopy = JSON.parse(JSON.stringify(original));
                                        delete layerCopy.layer.query;
                                        layerCopy.id = original.id + "-" + value.id;
                                        layerCopy.text = value.name;
                                        layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/DMS.png";
                                        layerCopy.layer.layers = "" + value.id;

                                        let id = $('#layerlistDiv').jstree('create_node', $("#" + pnode.a_attr.id), layerCopy, 'last', false, false);
                                        console.log($('#layerlistDiv').jstree().get_node(id));
                                    });
                                }
                            } else {
                                if (data.layers.length > 0) {
                                    console.log("... adding feature layers");
                                    $.each(data.layers, function (index, value) {
                                        original.layer.subLayers.push({ id: value.id, name: value.name });

                                        let layerCopy = JSON.parse(JSON.stringify(original));
                                        delete layerCopy.layer.query;
                                        layerCopy.id = original.id + "-" + value.id;
                                        layerCopy.text = value.name;
                                        if (value.type === "Feature Layer") {
                                            layerCopy.icon = "/esri-cmapi/plugins/layerlist/icons/FS.png";
                                            layerCopy.layer.params.serviceType = "feature";
                                        }
                                        layerCopy.layer.layers = "" + value.id;
                                        layerCopy.layer.query = false;

                                        let id = $('#layerlistDiv').jstree('create_node', $("#" + pnode.a_attr.id), layerCopy, 'last', false, false);
                                        console.log($('#layerlistDiv').jstree().get_node(id));
                                    });
                                }
                            }
                        } catch (exception) {
                            console.log(exception);
                        }
                    });
                }
            };

            self.addService = function (service) {
                if (service.layer.hasOwnProperty("params")) {
                    if (service.layer.params.hasOwnProperty("serviceType")) {
                        if (service.layer.params.serviceType === "dynamic") {
                            service.perspective = new esriDynamicMapService(map, search, notify, service);
                        } else if (service.layer.params.serviceType === "feature") {
                        }
                    }
                }
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