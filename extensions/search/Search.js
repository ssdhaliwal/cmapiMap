define(["esri/dijit/Search", "esri/layers/FeatureLayer", "esri/InfoTemplate"],
    function (esriSearch, FeatureLayer, InfoTemplate) {

        let extSearch = function (global) {
            let self = this;
            let map = global.map;
            let search = null;
            let sources = null;

            self.init = function () {
                search = new esriSearch({
                    enableButtonMode: true, //this enables the search widget to display as a single button
                    enableLabel: false,
                    enableInfoWindow: true,
                    showInfoWindowOnSelect: false,
                    map: map
                }, "search");

                sources = search.get("sources");

                //Push the sources used to search, by default the ArcGIS Online World geocoder is included. In addition there is a feature layer of US congressional districts. The districts search is set up to find the "DISTRICTID". Also, a feature layer of senator information is set up to find based on the senator name. 

                sources.push({
                    featureLayer: new FeatureLayer("https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/CongressionalDistricts/FeatureServer/0"),
                    searchFields: ["DISTRICTID"],
                    displayField: "DISTRICTID",
                    exactMatch: false,
                    outFields: ["DISTRICTID", "NAME", "PARTY"],
                    name: "Congressional Districts",
                    placeholder: "3708",
                    maxResults: 6,
                    maxSuggestions: 6,

                    //Create an InfoTemplate and include three fields
                    infoTemplate: new InfoTemplate("Congressional District",
                        "District ID: ${DISTRICTID}</br>Name: ${NAME}</br>Party Affiliation: ${PARTY}"
                    ),
                    enableSuggestions: true,
                    minCharacters: 0
                });

                sources.push({
                    featureLayer: new FeatureLayer("https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/US_Senators/FeatureServer/0"),
                    searchFields: ["Name"],
                    displayField: "Name",
                    exactMatch: false,
                    name: "Senator",
                    outFields: ["*"],
                    placeholder: "Senator name",
                    maxResults: 6,
                    maxSuggestions: 6,

                    //Create an InfoTemplate

                    infoTemplate: new InfoTemplate("Senator information",
                        "Name: ${Name}</br>State: ${State}</br>Party Affiliation: ${Party}</br>Phone No: ${Phone_Number}<br><a href=${Web_Page} target=_blank ;'>Website</a>"
                    ),

                    enableSuggestions: true,
                    minCharacters: 0
                });

                //Set the sources above to the search widget
                search.set("sources", sources);

                search.startup();
            };

            self.handleClick = function () {
            };
        };

        return extSearch;
    });