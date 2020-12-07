define(["vendor/js/jstree/jstree"],
    function (JSTree) {

        let extLayerlist = function (global) {
            let self = this;
            let map = global.extensions.extMap.map;
            self.layerlist = null;
            self.layers = [];

            self.init = function () {
                $('#layerlistDiv').jstree({
                    "plugins": ["wholerow", "checkbox"],
                    "checkbox": {
                        "keep_selected_style": false
                    },
                    'core': {
                        'data': [
                            'Simple root node',
                            {
                                'text': 'Root node 2',
                                'state': {
                                    'opened': true,
                                    'selected': false
                                },
                                'children': [
                                    { 'text': 'Child 1' },
                                    'Child 2',
                                    { 'text': 'Child 1' },
                                    'Child 2',
                                    { 'text': 'Child 1' },
                                    'Child 2',
                                    { 'text': 'Child 1' },
                                    'Child 2',
                                    {
                                        'text': 'Child 11',
                                        'state': {
                                            'opened': true,
                                            'selected': true
                                        },
                                        'children': [
                                            { 'text': 'Child 1' },
                                            'Child 2',
                                            { 'text': 'Child 1' },
                                            'Child 2',
                                            { 'text': 'Child 1' },
                                            'Child 2',
                                            { 'text': 'Child 1' },
                                            'Child 2',
                                            { 'text': 'Child 1' },
                                            'Child 2',
                                            { 'text': 'Child 1' },
                                            'Child 2',
                                            { 'text': 'Child 1' },
                                            'Child 2',
                                            { 'text': 'Child 1' },
                                            'Child 2'
                                        ]
                                    },
                                    'Child 2',
                                    { 'text': 'Child 1' },
                                    'Child 2',
                                    { 'text': 'Child 22',
                                    'state': {
                                        'opened': false,
                                        'selected': true
                                    },
                                    'children': [
                                        { 'text': 'Child 1' },
                                        'Child 2',
                                        { 'text': 'Child 1' },
                                        'Child 2',
                                        { 'text': 'Child 1' },
                                        'Child 2',
                                        { 'text': 'Child 1' },
                                        'Child 2',
                                        { 'text': 'Child 1' },
                                        'Child 2',
                                        { 'text': 'Child 1' },
                                        'Child 2',
                                        { 'text': 'Child 1' },
                                        'Child 2',
                                        { 'text': 'Child 1' },
                                        'Child 2'
                                    ]},
                                    'Child 2',
                                    { 'text': 'Child 1' },
                                    'Child 2'
                                ]
                            }
                        ]
                    }
                });

                self.registerEvents();
            };

            self.handleClick = function () {
                global.extensions.extToolbar.toggleOptions("#layerlist");

                if ($("#layerlist").hasClass("selected")) {
                    $("#layerlist_wrapper").css("display", "block");
                }
            };

            self.registerEvents = function () {
                $("#layerlist").on("click", self.handleClick);
            };

            self.addLayers = function (layers) {
                layers.forEach(element => {
                    console.log(element);
                    self.layers.push(element);
                });

                console.log(layers, self.layers);
            }
        };

        return extLayerlist;
    });