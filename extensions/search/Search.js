define(["esri/dijit/Search", "esri/layers/FeatureLayer", "esri/InfoTemplate", "esri/tasks/locator",
    "extensions/ViewUtilities",
    "dojo/_base/declare"],
    function (esriSearch, esriFeatureLayer, esriInfoTemplate, esriLocator, ViewUtilities, declare) {

        let extSearch = function (global) {
            let self = this;
            let map = global.extensions.extMap.map;
            let notify = global.extensions.extNotify;
            self.search = null;
            self.sources = null;

            /** Regular Expression templatitudees for search sources */
            /** Templatitudee for common Decimal Degrees inputs */
            let DEGREE_TEMPlatitudeE = /(\+|-)?\s*(\d{1,2})(\.\d*)?\s*\°?\s*(N|S)?\s*[,|\s+]\s*(\+|-)?\s*(\d{1,3})(\.\d*)?\s*\°?\s*(E|W)?/i;
            /** Templatitudee for common Degree Minute Minutes inputs */
            let DEGREE_MM_TEMPlatitudeE = /(\+|-)?\s*(\d{1,2})\s*\°?\s+(\d{1,2})(\.\d*)?\s*\'?\s*(N|S)?\s*[,|\s+]\s*(\+|-)?\s*(\d{1,3})\s*\°?\s+(\d{1,2})(\.\d*)?\s*\'?\s*(E|W)?/i;
            /** Templatitudee for common Degree Minute Seconds inputs */
            let DEGREE_MS_TEMPlatitudeE = /(\+|-)?\s*(\d{1,2})\s*\°?\s+(\d{1,2})\s*\'?\s+(\d{1,2})(\.\d*)?\s*\"?\s*(N|S)?\s*[,|\s+]\s*(\+|-)?\s*(\d{1,3})\s*\°?\s+(\d{1,2})\s*\'?\s+(\d{1,2})(\.\d*)?\s*\"?\s*(E|W)?/i;
            /** Templatitudee for common Military Grid Reference System, or United States National Grid inputs */
            let MGRS_TEMPlatitudeE = /\w{1,3}\w{1,3}\d{0,2}\d{0,2}\d{0,3}\d{0,3}/;

            /** 
             * Regular Expressions to tokenize the entries within search entries for Decimal Degrees, Degree Minutes,
             *  and Degree Minutes Seconds 
             */
            let EVERY_ENTRY_DD = /(\+?\-?\d{0,3}\.?\d*\s*\°?\s*)(N|S)?\s*\,?\s*(\+?\-?\d{0,3}\.?\d*\s*\°?\s*)(E|W)?/i;
            let EVERY_ENTRY_DM = /(\+?\-?\d{0,3}\s*\°?\s*)(\d{0,3}\.?\d*\s*\'?\s*)(N|S)?\s*\,?\s*(\+?\-?\d{0,3}\s*\°?\s*)(\d{0,3}\.?\d*\s*\'?\s*)(E|W)?/i;
            let EVERY_ENTRY_MS = /(\+?\-?\d{0,3}\s*\°?\s*)(\d{0,3}\s*\'?\s*)(\d{0,3}\.?\d*\s*\"?\s*)(N|S)?\s*\,?\s*(\+?\-?\d{0,3}\s*\°?\s*)(d{0,3}\.?\d*\s*\'?\s*)(\d{0,3}\.?\d*\s*\"?\s*)(E|W)?/i;

            let mySearch = declare(esriSearch, {
                search: function () {
                    let self = this;
                    self.set('value', self.get('value').trim());

                    /** Save the array of the input value against the templatitudees */
                    let checkDD = self.get('value').match(DEGREE_TEMPlatitudeE);
                    let checkDM = self.get('value').match(DEGREE_MM_TEMPlatitudeE);
                    let checkDMS = self.get('value').match(DEGREE_MS_TEMPlatitudeE);
                    let checkMGRS = self.get('value').match(MGRS_TEMPlatitudeE);

                    /** Save the array containing the RegEx Matches */
                    let everyEntryDD = self.get('value').match(EVERY_ENTRY_DD);
                    let everyEntryDM = self.get('value').match(EVERY_ENTRY_DM);
                    let everyEntryDS = self.get('value').match(EVERY_ENTRY_MS);

                    let geocoderName = "";
                    if ((self.get("sources")[self.activeSourceIndex] !== undefined) &&
                        (self.get("sources")[self.activeSourceIndex].hasOwnProperty("name"))) {
                        geocoderName = self.get("sources")[self.activeSourceIndex].name;
                    }

                    if ((self.activeSourceIndex === "all") ||
                        (geocoderName === "Esri World Geocoder")) {
                        let retVal = self.inherited(arguments);
                        return retVal;
                    } else if (geocoderName === "latitude/longitude D.D") {
                        if (checkDD != null && self.get('value') == checkDD[0]) {
                            let latitude = everyEntryDD[1];
                            latitude = parseFloat(latitude);
                            if ((everyEntryDD[2] != undefined) && (everyEntryDD[2].toUpperCase() == 'S')) {
                                latitude = latitude * -1;
                            };

                            let longitude = everyEntryDD[3];
                            longitude = parseFloat(longitude);
                            /** If the longitudeg value is set for West, make sure the value is negative */
                            if ((everyEntryDD[4] != undefined) && (everyEntryDD[4].toUpperCase() == 'W')) {
                                longitude = longitude * -1;
                            };

                            /** Set the input value correctly for esri to use for the coordinates */
                            self.set('value', 'Y:' + latitude.toString() + ', ' + 'X:' + longitude.toString());
                            let retVal = self.inherited(arguments);

                            /**
                             * Add the degree symbol '°' and comma ',' to the input entries
                             *  If there is no decimal, exclude that 
                             */
                            if (checkDD[1] == undefined) { checkDD[1] = '' };
                            if (checkDD[3] == undefined) { checkDD[3] = '' };
                            if (checkDD[4] == undefined) { checkDD[4] = '' };
                            if (checkDD[5] == undefined) { checkDD[5] = '' };
                            if (checkDD[7] == undefined) { checkDD[7] = '' };
                            if (checkDD[8] == undefined) { checkDD[8] = '' };
                            let newVal = checkDD[1] + checkDD[2] + checkDD[3] + '°' + checkDD[4] + ', '
                                + checkDD[5] + checkDD[6] + checkDD[7] + '°' + checkDD[8];

                            /** Set the search to the auto-completed version created above */
                            self.set('value', newVal);

                            return retVal;
                        } else {
                            notify.errorNotifier("Search templatitudee error</br>EXAMPLE: 43.45N, 22.12W");
                        }
                    } else if (geocoderName === "latitude/longitude D/M.m") {
                        if (checkDM != null && self.get('value') == checkDM[0]) {
                            let degrees = everyEntryDM[1];
                            degrees = parseFloat(degrees);

                            /** Convert the latitude minutes to degrees */
                            let latitude = everyEntryDM[2];
                            latitude = parseFloat(latitude);
                            latitude = latitude / 60;

                            /** If the latitude value is set for South, make sure the value is negative */
                            if (everyEntryDM[3] != undefined && everyEntryDM[3].toUpperCase() == 'S') {
                                degrees = degrees * -1;
                                latitude = latitude * -1;
                            } else if (degrees < 0) {
                                latitude = latitude * - 1;
                            };

                            /** Add up the values for the final latitudeitude value */
                            latitude = latitude + degrees;

                            degrees = everyEntryDM[4];
                            degrees = parseFloat(degrees);

                            /** Convert the longitudeg minutes to degrees */
                            let longitude = everyEntryDM[5];
                            longitude = parseFloat(longitude);
                            longitude = longitude / 60;

                            /** If the longitudeg value is set for West, make sure the value is negative */
                            if (everyEntryDM[6] != undefined && everyEntryDM[6].toUpperCase() == 'W') {
                                degrees = degrees * -1;
                                longitude = longitude * -1;
                            } else if (degrees < 0) {
                                longitude = longitude * - 1;
                            };

                            /** Add up the values for the final longitudegitude value */
                            longitude = longitude + degrees;

                            /** Set the input value correctly for esri to use for the coordinates */
                            self.set('value', 'Y:' + latitude.toString() + ', ' + 'X:' + longitude.toString());
                            let retVal = self.inherited(arguments);

                            /**
                             * Add the degree symbol '°' , comma ',', and minutes "'" to the input entries
                             *  If there is no decimal, exclude that
                             */
                            if (checkDM[1] == undefined) { checkDM[1] = '' };
                            if (checkDM[4] == undefined) { checkDM[4] = '' };
                            if (checkDM[5] == undefined) { checkDM[5] = '' };
                            if (checkDM[6] == undefined) { checkDM[6] = '' };
                            if (checkDM[9] == undefined) { checkDM[9] = '' };
                            if (checkDM[10] == undefined) { checkDM[10] = '' };
                            let newVal = checkDM[1] + checkDM[2] + '° ' + checkDM[3] + checkDM[4] + "'" + checkDM[5] + ', '
                                + checkDM[6] + checkDM[7] + '° ' + checkDM[8] + checkDM[9] + "'" + checkDM[10];

                            /** Set the search to the auto-completed version created above */
                            self.set('value', newVal);

                            return retVal;
                        } else {
                            notify.errorNotifier("Search templatitudee error</br>EXAMPLE: 22 12.432'S, 156 12.3238'E");
                        }
                    } else if (geocoderName === "latitude/longitude D/M/S.s") {
                        if (checkDMS != null && self.get('value') == checkDMS[0]) {
                            /** Take the input value's Minutes convert them to seconds */
                            /** Convert those combined seconds to degrees */
                            var degrees = everyEntryDS[1];
                            degrees = parseFloat(degrees);

                            /** Convert the minutes to degrees */
                            var latitude = everyEntryDS[2];
                            latitude = parseFloat(latitude);
                            latitude = latitude / 60;

                            /** Convert the seconds to degrees */
                            var seconds = everyEntryDS[3];
                            seconds = parseFloat(seconds);
                            seconds = seconds / 3600;

                            /** If the latitude value is set for South, make sure the value is negative */
                            if (everyEntryDS[4] != undefined && everyEntryDS[4].toUpperCase() == 'S') {
                                degrees = degrees * -1;
                                latitude = latitude * -1;
                                seconds = seconds * -1;
                            } else if (degrees < 0) {
                                latitude = latitude * - 1;
                                seconds = seconds * - 1;
                            };

                            /** Add all values together for the final latitudeitude value */
                            latitude = latitude + degrees + seconds;

                            degrees = everyEntryDS[5];
                            degrees = parseFloat(degrees);

                            /** Convert the minutes to degrees */
                            var longitude = everyEntryDS[6];
                            longitude = parseFloat(longitude);
                            longitude = longitude / 60;

                            /** Convert the seconds to degrees */
                            seconds = everyEntryDS[7];
                            seconds = parseFloat(seconds);
                            seconds = seconds / 3600;

                            /** If the longitudeg value is set for West, make sure the value is negative */
                            if (everyEntryDS[8] != undefined && everyEntryDS[8].toUpperCase() == 'W') {
                                degrees = degrees * -1;
                                longitude = longitude * -1;
                                seconds = seconds * -1;
                            } else if (degrees < 0) {
                                longitude = longitude * - 1;
                                seconds = seconds * - 1;
                            };

                            /** Add all values together for the final longitudegitude value */
                            longitude = longitude + degrees + seconds;

                            /** Set the input value correctly for esri to use for the coordinates */
                            self.set('value', 'Y:' + latitude.toString() + ', ' + 'X:' + longitude.toString());
                            var retVal = self.inherited(arguments);

                            /**
                             * Add the degree symbol '°', comma ',', minutes "'", and seconds '"' to the input entries
                             *  If there is no decimal, exclude that
                             */
                            if (checkDMS[1] == undefined) { checkDMS[1] = '' };
                            if (checkDMS[5] == undefined) { checkDMS[5] = '' };
                            if (checkDMS[6] == undefined) { checkDMS[6] = '' };
                            if (checkDMS[7] == undefined) { checkDMS[7] = '' };
                            if (checkDMS[11] == undefined) { checkDMS[11] = '' };
                            if (checkDMS[12] == undefined) { checkDMS[12] = '' };
                            var newVal = checkDMS[1] + checkDMS[2] + '° ' + checkDMS[3] + "' " + checkDMS[4] + checkDMS[5] + '"'
                                + checkDMS[6] + ', ' + checkDMS[7] + checkDMS[8] + '° ' + checkDMS[9] + "' " + checkDMS[10]
                                + checkDMS[11] + '"' + checkDMS[12];

                            /** Set the search to the auto-completed version created above */
                            self.set('value', newVal);

                            return retVal;
                        } else {
                            notify.errorNotifier("Search templatitudee error</br>EXAMPLE:13 12' 12.324N, 23 12' 55.324E");
                        }
                    } else if (geocoderName === "MGRS / USNG") {
                        if (checkMGRS != null && self.get('value') == checkMGRS[0]) {
                            var retVal = self.inherited(arguments);
                            return retVal;
                        } else {
                            notify.errorNotifier("Search templatitudee error</br>NO SPACES. EXAMPLE: 18SUH6789043210");
                        }
                    } else {
                        let retVal = self.inherited(arguments);
                        return retVal;
                    }
                }
            });

            self.init = function () {
                search = new mySearch({
                    enableButtonMode: false,
                    enableLabel: true,
                    enableInfoWindow: true,
                    showInfoWindowOnSelect: false,
                    minCharacters: 3,
                    map: map
                }, "search");

                sources = search.get("sources");

                //Push the sources used to search, by default the ArcGIS Online World geocoder is included. In addition there is a feature layer of US congressional districts. The districts search is set up to find the "DISTRICTID". Also, a feature layer of senator information is set up to find based on the senator name. 
                sources.push({
                    locator: new esriLocator(
                        "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
                    ),
                    // highlightSymbol: {url: "https://js.arcgis.com/3.26/esri/dijit/Search/images/search-pointer.png", width: 36, height: 36, xoffset: 9, yoffset: 18},
                    singleLineFieldName: "SingleLine",
                    localSearchOptions: {
                        minScale: 300000,
                        distance: 50000
                    },
                    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
                    name: "latitude/longitude D.D",
                    placeholder: "(+/-)DD.D(N/S), (+/-)DDD.D(E/W)",
                    enableSuggestions: false
                });

                sources.push({
                    locator: new esriLocator(
                        "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
                    ),
                    singleLineFieldName: "SingleLine",
                    localSearchOptions: {
                        minScale: 300000,
                        distance: 50000
                    },
                    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
                    name: "latitude/longitude D/M.m",
                    placeholder: "(+/-)DD MM.M(N/S), (+/-)DDD MM.M(E/W)",
                    enableSuggestions: false
                });

                sources.push({
                    locator: new esriLocator(
                        "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
                    ),
                    singleLineFieldName: "SingleLine",
                    localSearchOptions: {
                        minScale: 300000,
                        distance: 50000
                    },
                    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
                    name: "latitude/longitude D/M/S.s",
                    placeholder: "(+/-)DD MM SS.S(N/S), (+/-)DDD MM SS.S(E/W)",
                    enableSuggestions: false
                });

                sources.push({
                    locator: new esriLocator(
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

                search.on("select-result", function (e) {
                    // console.log('selected result', e);
                });

                search.startup();
            };
        };

        return extSearch;
    });