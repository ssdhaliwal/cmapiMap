define(["esri/dijit/Search", "esri/layers/FeatureLayer", "esri/InfoTemplate", "esri/tasks/locator", "dojo/_base/declare"],
    function (esriSearch, FeatureLayer, InfoTemplate, Locator, declare) {

        let extSearch = function (global) {
            let self = this;
            let map = global.map;
            let search = null;
            let sources = null;

            let mySearch = declare(esriSearch, {
                search: function() {
                    let self = this;
                    self.set('value', self.get('value').trim());

                    console.log(".... searching ....", self.activeSourceIndex, self.activeSourceIndex, self.get("sources")[self.activeSourceIndex], self.get('value'));
                }
            });

            self.init = function () {
                search = new mySearch({
                    enableButtonMode: true, //this enables the search widget to display as a single button
                    enableLabel: false,
                    enableInfoWindow: true,
                    showInfoWindowOnSelect: false,
                    map: map
                }, "search");

                sources = search.get("sources");

                //Push the sources used to search, by default the ArcGIS Online World geocoder is included. In addition there is a feature layer of US congressional districts. The districts search is set up to find the "DISTRICTID". Also, a feature layer of senator information is set up to find based on the senator name. 
                sources.push({
                    locator: new Locator(
                        "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
                    ),
                    // highlightSymbol: {url: "https://js.arcgis.com/3.26/esri/dijit/Search/images/search-pointer.png", width: 36, height: 36, xoffset: 9, yoffset: 18},
                    singleLineFieldName: "SingleLine",
                    localSearchOptions: {
                        minScale: 300000,
                        distance: 50000
                    },
                    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
                    name: "Lat/Long D.D",
                    placeholder: "(+/-)DD.D(N/S), (+/-)DDD.D(E/W)",
                    enableSuggestions: false
                });

                sources.push({
                    locator: new Locator(
                        "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
                    ),
                    singleLineFieldName: "SingleLine",
                    localSearchOptions: {
                        minScale: 300000,
                        distance: 50000
                    },
                    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
                    name: "Lat/Long D/M.m",
                    placeholder: "(+/-)DD MM.M(N/S), (+/-)DDD MM.M(E/W)",
                    enableSuggestions: false
                });

                sources.push({
                    locator: new Locator(
                        "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
                    ),
                    singleLineFieldName: "SingleLine",
                    localSearchOptions: {
                        minScale: 300000,
                        distance: 50000
                    },
                    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
                    name: "Lat/Long D/M/S.s",
                    placeholder: "(+/-)DD MM SS.S(N/S), (+/-)DDD MM SS.S(E/W)",
                    enableSuggestions: false
                });

                sources.push({
                    locator: new Locator(
                        "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"
                    ),
                    singleLineFieldName: "SingleLine",
                    localSearchOptions: {
                        minScale: 300000,
                        distance: 50000
                    },
                    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
                    name: "MGRS / USNG",
                    placeholder: "NO SPACES",
                    enableSuggestions: false
                });

                //Set the sources above to the search widget
                search.set("sources", sources);

                search.startup();
            };
        };

        return extSearch;
    });