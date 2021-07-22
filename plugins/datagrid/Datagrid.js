define(["dojo/_base/lang", "dijit/registry", "dojo/query",
    "dijit/layout/TabContainer", "dijit/layout/ContentPane", "dojox/grid/DataGrid",
    "dojo/data/ItemFileWriteStore", "dojo/data/ItemFileReadStore"],
    function (lang, registry, query, TabContainer, ContentPane, DataGrid, ItemFileWriteStore, ItemFileReadStore) {
        let extDatagrid = function (globals) {
            let self = this;
            let extMap = globals.plugins.extMap;
            self.instance = null;
            self.sources = [];
            self.showing = false;
            self.tabs = {};

            self.init = function () {
                // console.log("extDatagrid - init");

                self.instance = registry.byId("datagrid_container");

                // adjust the navigation button style
                query("#datagrid_container_tablist_menuBtn").style({ padding: "0" });
                query("#datagrid_container_tablist_leftBtn").style({ padding: "0" });
                query("#datagrid_container_tablist_rightBtn").style({ padding: "0" });

                self.registerEvents();
            };

            self.handleClick = function () {
                // console.log("extDatagrid - handleClick");
                self.showing = !self.showing;

                if (self.showing) {
                    //$("#datagrid_wrapper").css("display", "block");
                    $("#datagrid_wrapper").css("z-index", "99");

                    // loop through the grids and resize them
                    Object.keys(self.tabs).forEach(function(tab) {
                        if (tab.startsWith("grid_")) {
                            self.tabs[tab].resize();
                        }
                    });
                } else {
                    //$("#datagrid_wrapper").css("display", "none");
                    $("#datagrid_wrapper").css("z-index", "-1");
                }

                $("#datagrid").toggleClass("selected");
            };

            self.show = function() {
                // console.log("extDatagrid - show");

                $("#datagrid").css("display", "block");
            };

            self.hide = function() {
                // console.log("extDatagrid - hide");

                $("#datagrid").css("display", "none");
            };

            self.registerEvents = function () {
                // console.log("extDatagrid - registerEvents");
                $("#datagrid").on("click", function ($event) {
                    // console.log("extDatagrid - registerEvents/click");
                    self.handleClick();
                });
            };

            self.addTab = function (serviceObject) {
                // console.log("extDatagrid - addTab");

                // if tab already exists, exit
                if (self.tabs['tab_' + serviceObject.service.text]) {
                    self.removeTab(serviceObject);
                }

                // auto add if feature or local kml layer type
                // currently supported; feature layers and kml - push filters to layer
                // console.log(serviceObject);
                let gridDiv = dojo.create('div', {
                    id: 'div_' + serviceObject.service.text,
                    class: "datagridDiv"
                });

                let cp3 = new ContentPane({
                    id: 'tab_' + serviceObject.service.text,
                    title: serviceObject.service.text,
                    content: gridDiv
                });

                // add in the sequence (for resize on load)
                self.tabs['tab_' + serviceObject.service.text] = cp3;
                self.tabs['div_' + serviceObject.service.text] = gridDiv;

                // to form the grid, we need to get the service object to provide id, structure, and data
                let checkIW = setInterval(function() {
                    if (serviceObject.service.perspective) {
                        clearInterval(checkIW);
                        let serviceData = serviceObject.service.perspective.getData();

                        serviceData.then(function(payload) {
                            if (payload.items.length > 0) {
                                // console.log(payload, Object.keys(payload.items[0]));

                                // format the data for store/grid
                                let dataStore = new ItemFileWriteStore({
                                    data: payload
                                });
        
                                // define the grid layout based on keys
                                let layout = [[]];
                                Object.keys(payload.items[0]).forEach(function(key) {
                                    layout[0].push({ 'name': key, 'field': key, 'width': '100px' });
                                });
        
                                let grid = new DataGrid({
                                    id: 'grid_' + serviceObject.service.text,
                                    store: dataStore,
                                    structure: layout,
                                    rowSelector: '20px'
                                });
        
                                grid.on("RowClick", function($event) {
                                    let idx = $event.rowIndex,
                                        rowData = grid.getItem(idx);
                                    
                                    extMap.handleCenterLocationLatLon(rowData.latitude, rowData.longitude); 
                                });

                                self.tabs['grid_' + serviceObject.service.text] = grid;
                                self.instance.addChild(cp3);
        
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
                        }, function (error) {
                            // console.log(error);
                        });
                    }
                }, 500);
            };

            self.removeTab = function (serviceObject) {
                // console.log("extDatagrid - removeTab");

                // only via layer remove
                // console.log(serviceObject.service);

                let divContainer = self.tabs['div_' + serviceObject.service.text];
                let gridContainer = self.tabs['grid_' + serviceObject.service.text];
                let tabContainer = self.tabs['tab_' + serviceObject.service.text];

                if (tabContainer && gridContainer) {
                    try {
                        tabContainer.removeChild(gridContainer);
                    } catch(err) {}

                    try {
                        gridContainer.destroy();
                    } catch(err) {}
                }

                if (tabContainer) {
                    try {
                        self.instance.removeChild(tabContainer);
                    } catch(err) {}

                    try {
                        tabContainer.destroy();
                    } catch(err) {}
                }

                if (divContainer) {
                    try {
                        tabContainer.removeChild(divContainer);
                    } catch(err) {}

                    try {
                        divContainer.destroy();
                    } catch(err) {}
                }

                delete self.tabs['div_' + serviceObject.service.text];
                delete self.tabs['grid_' + serviceObject.service.text];
                delete self.tabs['tab_' + serviceObject.service.text];
            };

            self.init();
        };

        return extDatagrid;
    });