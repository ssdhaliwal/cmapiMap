define(["dojo/_base/lang", "dijit/registry", "dojo/query",
    "dijit/layout/TabContainer", "dijit/layout/ContentPane", "dojox/grid/DataGrid",
    "dojo/data/ItemFileWriteStore", "dojo/data/ItemFileReadStore"],
    function (lang, registry, query, TabContainer, ContentPane, DataGrid, ItemFileWriteStore, ItemFileReadStore) {
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

                // adjust the navigation button style
                query("#datagrid_container_tablist_menuBtn").style({ padding: "0" });
                query("#datagrid_container_tablist_leftBtn").style({ padding: "0" });
                query("#datagrid_container_tablist_rightBtn").style({ padding: "0" });

                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("extDatagrid - handleClick");
                self.showing = !self.showing;

                if (self.showing) {
                    $("#datagrid_wrapper").css("display", "block");

                    // loop through the grids and resize them
                    Object.keys(self.tabs).forEach(tab => {
                        if (tab.startsWith("grid_")) {
                            self.tabs[tab].resize();
                        }
                    });
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
                console.log(serviceObject);
                let gridDiv = dojo.create('div', {
                    id: 'div_' + serviceObject.service.text,
                    class: "datagridDiv"
                });
                let cp3 = new ContentPane({
                    id: 'content_' + serviceObject.service.text,
                    title: serviceObject.service.text,
                    content: gridDiv
                });

                // to form the grid, we need to get the service object to provide id, structure, and data
                let checkIW = setInterval(() => {
                    if (serviceObject.service.perspective) {
                        clearInterval(checkIW);
                        let serviceData = serviceObject.service.perspective.getData();
                        console.log(serviceData, Object.keys(serviceData.items[0]));

                        // format the data for store/grid
                        let dataStore = new ItemFileWriteStore({
                            data: serviceData
                        });

                        // define the grid layout based on keys
                        let layout = [[]];
                        Object.keys(serviceData.items[0]).forEach(key => {
                            layout[0].push({ 'name': key, 'field': key, 'width': '100px' });
                        });

                        let grid = new DataGrid({
                            id: 'grid_' + serviceObject.service.text,
                            store: dataStore,
                            structure: layout,
                            rowSelector: '20px'
                        });

                        self.tabs['div_' + serviceObject.service.text] = gridDiv;
                        self.tabs['grid_' + serviceObject.service.text] = grid;
                        self.tabs['content_' + serviceObject.service.text] = cp3;

                        self.tabContainer.addChild(cp3);

                        new Promise(function (resolve, reject) {
                            grid.placeAt('div_' + serviceObject.service.text);
                            grid.startup();
                            resolve(grid);
                        }).then(function (grid) {
                            // grid.placeAt(cp3.containerNode);
                            grid.height = "calc(250px - 69px)";
                            grid.resize();
                        });
                    }
                }, 500);
            };

            self.removeTab = function (serviceObject) {
                console.log("extDatagrid - removeTab");

                // only via layer remove
                console.log(serviceObject.service);

                let tableContainer = self.tabs['div_' + serviceObject.service.text];
                let gridContainer = self.tabs['grid_' + serviceObject.service.text];
                let tabContainer = self.tabs['content_' + serviceObject.service.text];

                tabContainer.removeChild(gridContainer);
                gridContainer.destroy();

                self.tabContainer.removeChild(tabContainer);
                tabContainer.destroy();

                tabContainer.removeChild(tableContainer);
                //tableContainer.destroy();

                delete self.tabs['div_' + serviceObject.service.text];
                delete self.tabs['grid_' + serviceObject.service.text];
                delete self.tabs['content_' + serviceObject.service.text];
            };

            self.init();
        };

        return extDatagrid;
    });