define(["dojo/_base/lang", "dijit/registry",
    "dijit/layout/TabContainer", "dijit/layout/ContentPane", "dojox/grid/DataGrid",
    "dojo/data/ItemFileWriteStore", "dojo/data/ItemFileReadStore"],
    function (lang, registry, TabContainer, ContentPane, DataGrid, ItemFileWriteStore, ItemFileReadStore) {

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
                console.log(service);
                let gridTable = dojo.create('div', {
                    id : 'div_' + serviceObject.service.text,
                    class : "datagridDiv"
                });
                let cp3 = new ContentPane({
                    id: 'content_' + serviceObject.service.text,
                    title: serviceObject.service.text,
                    content: gridTable
                });

                let dataStore = new ItemFileWriteStore({
                    data: {
                        identifier: "id",
                        items: [{
                            id: Math.floor(Math.random() * 100),
                            col1: "normal",
                            col2: false,
                            col3: "But are not followed by two hexadecimal",
                            col4: 29.91
                        }]
                    }
                });

                let layout = [[
                    { 'name': 'Column 1', 'field': 'id', 'width': '100px' },
                    { 'name': 'Column 2', 'field': 'col2', 'width': '100px' },
                    { 'name': 'Column 3', 'field': 'col3', 'width': '200px' },
                    { 'name': 'Column 4', 'field': 'col4', 'width': '150px' }
                ]];

                let grid = new DataGrid({
                    id: 'grid_' + serviceObject.service.text,
                    store : dataStore,
                    structure: layout,
                    rowSelector: '20px'
                }, 'div_' + serviceObject.service.text);

                self.tabs['table_' + serviceObject.service.text] = gridTable;
                self.tabs['grid_' + serviceObject.service.text] = grid;
                self.tabs['content_' + serviceObject.service.text] = cp3;

                self.tabContainer.addChild(cp3);

                new Promise(function (resolve, reject) {
                    resolve(grid);
                }).then(function (grid) {
                    // grid.placeAt(cp3.containerNode);
                    grid.startup();

                    grid.height = "calc(100vh)";
                    grid.resize();
                });
            };

            self.removeTab = function (serviceObject) {
                console.log("extDatagrid - removeTab");

                // only via layer remove
                console.log(serviceObject.service);

                let tableContainer = self.tabs['table_' + serviceObject.service.text];
                let gridContainer = self.tabs['grid_' + serviceObject.service.text];
                let tabContainer = self.tabs['content_' + serviceObject.service.text];

                tabContainer.removeChild(gridContainer);
                gridContainer.destroy();

                self.tabContainer.removeChild(tabContainer);
                tabContainer.destroy();

                tabContainer.removeChild(tableContainer);
                tableContainer.destroy();

                delete self.tabs['table_' + serviceObject.service.text];
                delete self.tabs['grid_' + serviceObject.service.text];
                delete self.tabs['content_' + serviceObject.service.text];
            };

            self.init();
        };

        return extDatagrid;
    });