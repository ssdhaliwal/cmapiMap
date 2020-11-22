define(["dojo/promise/all",
        "esri/request",
        "esri/kernel", "esri/geometry/Extent", "app/extensions/ViewUtils"
    ],
    function (all, esriRequest, EsriNS, Extent, ViewUtils) {
        /**
         * @copyright © 2013 Environmental Systems Research Institute, Inc. (Esri)
         *
         * @license
         *
         * Licensed under the Apache License, Version 2.0 (the "License");
         * you may not use this file except in compliance with the License.
         * You may obtain a copy of the License at<br>
         * <br>
         *     {@link http://www.apache.org/licenses/LICENSE-2.0}<br>
         * <br>
         * Unless required by applicable law or agreed to in writing, software
         * distributed under the License is distributed on an "AS IS" BASIS,
         * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
         * See the License for the specific language governing permissions and
         * limitations under the License.
         *
         * @version 1.1
         *
         * @module cmwapi-adapter/Status
         */

        /**
         * @constructor
         * @param adapter {module:cmwapi-adapter/cmwapi-adapter}
         * @param map {object} ESRI map object for which this adapter should apply
         * @alias module:cmwapi-adapter/Status
         */
        var Geocoder = function (adapater, map) {
            var me = this;

            /**
             * Handler for an incoming map status request.
             * @method handleRequest
             * @param caller {String} optional; the widget making the status request
             * @param data {"searchFor":...}
             * @memberof module:cmwapi-adapter/Geocoder#
             */
            me.handleRequest = function (caller, data) {
                me.serve(caller, data);
            };
            /*
            CommonMapApi.geocoder.request.addHandler(me.handleRequest);
            */

            /**
             * Calculate the view details of the map and announce via the CMW-API
             * @method serve
             * @param caller {String} The Id of the widget which requested the map view status
             * @memberof module:cmwapi-adapter/Geocoder#
             */
            me.serve = function (caller, data) {
                all({
                    poiSearch: me.geoServiceRequest(data),
                    poiRequest: me.geoServiceParams(caller, data)
                }).then(me.geoServiceResults);
            }

            me.geoServiceParams = function(caller, data) {
                return {caller: caller, request: data};
            }

            me.geoServiceRequest = function (data) {
                var mapCenter = map.extent.getCenter();
                delete mapCenter.type;

                var serviceUrl = window.esriWorldGeocoderServiceFind;
                var params = {};

                if (data.hasOwnProperty("searchType")) {
                    if (data.searchType === "address") {
                        serviceUrl = window.esriWorldGeocoderServiceCandidates;
                        params.singleLine = data.searchFor;
                        params.outFields = "Match_addr, Addr_type";
                    } else
                    if (data.searchType === "location") {
                        serviceUrl = window.esriWorldGeocoderServiceCandidates;
                        params.category = data.searchFor;
                        params.location = data.location;
                        params.outFields = "Place_addr, PlaceName";
                    }
                } else {
                    params.text = data.searchFor;
                    params.category = "Address, Postal";

                    params.location = JSON.stringify(mapCenter);
                    params.bbox = JSON.stringify(map.extent.toJson());
                    if (data.hasOwnProperty("limitExtent")) {
                        if (!data.limitExtent) {
                            delete params.location;
                            delete params.bbox;
                        }
                    }
                }

                params.maxLocations = (!data.maxResults ? 20 : data.maxResults);
                params.f = "json";
                
                return esriRequest({
                    url: serviceUrl,
                    content: params,
                    callbackParamName: "callback"
                });
            }

            me.geoServiceResults = function (results) {
                if (results.poiSearch) {
                    /*
                    CommonMapApi.geocoder.request.send(results.poiRequest, results.poiSearch);
                    */
                } else {
                    /*
                    CommonMapApi.error.send(results.poiRequest.caller, Channels.MAP_GEOCODER_REQUEST, results.poiRequest.data, "Unable to process request");
                    */
                }
            }
        };

        return Geocoder;
    });