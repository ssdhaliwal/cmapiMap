define(["dojo/_base/lang", "dijit/registry",
    "dijit/layout/TabContainer", "dijit/layout/ContentPane", "dojox/grid/DataGrid",
    "dojo/data/ItemFileWriteStore"],
    function (lang, registry, TabContainer, ContentPane, DataGrid, ItemFileWriteStore) {

        let extDatagrid = function (global) {
            let self = this;
            let map = global.plugins.extMap.instance;
            self.instance = null;
            self.sources = [];
            self.showing = false;
            self.tabContainer = null;
            self.tabs = {};

            self.init = function () {
                console.log("extDatagrid - init");

                self.tabContainer = registry.byId("datagrid_container");
                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("extDatagrid - handleClick");
                self.showing = !self.showing;

                if (self.showing) {
                    $("#datagrid_wrapper").css("display", "block");
                } else {
                    $("#datagrid_wrapper").css("display", "none");
                }

                $("#datagrid").toggleClass("selected");
            };

            self.registerEvents = function () {
                console.log("extDatagrid - registerEvents");
                $("#datagrid").on("click", function ($event) {
                    console.log("extDatagrid - registerEvents/click");
                    self.handleClick();
                });
            };

            self.addTab = function (serviceObject) {
                console.log("extDatagrid - addTab");

                // auto add if feature or local kml layer type
                // currently supported; feature layers and kml - push filters to layer
                /*
                console.log(service);
                var cp1 = new ContentPane({
                    title: "Food",
                    content: "We offer amazing food"
                });
                self.tabContainer.addChild(cp1);

                var cp2 = new ContentPane({
                    title: "Drinks",
                    content: "We are known for our drinks."
                });
                self.tabContainer.addChild(cp2);

                var cp = new ContentPane({
                    title: serviceObject.service.text,
                    content: ,
                    closable: true,
                    onClose: function(){
                       // confirm() returns true or false, so return that.
                       return confirm("Do you really want to Close this?");
                    }
               });
               self.tabContainer.addChild(cp);
               self.tabContainer.selectChild(cp);
               */

                let data = {
                    identifier: "id",
                    items: []
                };
                let data_list = [
                    { col1: "normal", col2: false, col3: 'But are not followed by two hexadecimal', col4: 29.91 },
                    { col1: "important", col2: false, col3: 'Because a % sign always indicates', col4: 9.33 },
                    { col1: "important", col2: false, col3: 'Signs can be selectively', col4: 19.34 }
                ];
                let rows = 60;
                for (let i = 0, l = data_list.length; i < rows; i++) {
                    data.items.push(lang.mixin({ id: i + 1 }, data_list[i % l]));
                }
                let store = new ItemFileWriteStore({ data: data });

                let layout = [[
                    { 'name': 'Column 1', 'field': 'id', 'width': '100px' },
                    { 'name': 'Column 2', 'field': 'col2', 'width': '100px' },
                    { 'name': 'Column 3', 'field': 'col3', 'width': '200px' },
                    { 'name': 'Column 4', 'field': 'col4', 'width': '150px' }
                ]];

                let grid = new DataGrid({
                    id: 'grid_' + serviceObject.service.text,
                    store: store,
                    structure: layout,
                    rowSelector: '20px'
                });
                let cp3 = new ContentPane({
                    id: 'content_' + serviceObject.service.text,
                    title: serviceObject.service.text,
                    content: grid
                });

                // grid.placeAt(cp3.containerNode);
                grid.startup();

                self.tabs['grid_' + serviceObject.service.text] = grid;
                self.tabs['content_' + serviceObject.service.text] = cp3;

                self.tabContainer.addChild(cp3);

                new Promise(function (resolve, reject) {
                    resolve(grid);
                }).then(function (grid) {
                    grid.height = "calc(100vh)";
                    grid.resize();
                });
            };

            self.removeTab = function (serviceObject) {
                console.log("extDatagrid - removeTab");

                // only via layer remove
                console.log(serviceObject.service);

                let gridContainer = self.tabs['grid_' + serviceObject.service.text];
                let tabContainer = self.tabs['content_' + serviceObject.service.text];

                tabContainer.removeChild(gridContainer);
                gridContainer.destroy();

                self.tabContainer.removeChild(tabContainer);
                tabContainer.destroy();

                delete self.tabs['grid_' + serviceObject.service.text];
                delete self.tabs['content_' + serviceObject.service.text];
            };

            self.init();
        };

        return extDatagrid;
    });