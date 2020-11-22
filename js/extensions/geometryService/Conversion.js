define(["dojo/promise/all", "dojo/Deferred",
    "esri/request",
    "esri/kernel", "esri/tasks/GeometryService", "esri/geometry/coordinateFormatter"
],
    function (all, Deferred, esriRequest, EsriNS, GeometryService, coordinateFormatter) {
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
        var Conversion = function (adapater, map) {
            var me = this;

            /**
             * Handler for an incoming map status request.
             * @method handleRequest
             * @param caller {String} optional; the widget making the status request
             * @param data {"searchFor":...}
             * @memberof module:cmwapi-adapter/Conversion#
             */
            me.handleRequest = function (caller, data) {
                me.serve(caller, data);
            };
            /*
            CommonMapApi.conversion.request.addHandler(me.handleRequest);
            */

            /**
             * send results from conversion digit
             */
            me.send = function (event) {
                /* do nothing, no digit - or api direct support */
            }

            /**
             * Calculate the view details of the map and announce via the CMW-API
             * @method serve
             * @param caller {String} The Id of the widget which requested the map view status
             * @memberof module:cmwapi-adapter/Conversion#
             */
            me.serve = function (caller, data) {
                me.geometryService = new GeometryService(window.esriGeometryService);

                var params = {};

                // if format request; otherwise it is a batch/server conversion request
                /*
                // only supported for webAssembly browsers
                if (data.conversionType === "format") {
                    // do latlon
                    if (data.formatFrom.type === "latlon") {
                        var poiRequest = me.conversionParams(caller, data);
                        coordinateFormatter.load().then(function () {
                            var point = coordinateFormatter.fromLatitudeLongitude(data.formatFrom.coordinates,
                                data.spatialReference);

                            var result = me.getToFormatRequest(point, data, poiRequest);
                        });
                    }
                    // do mgrs
                    else
                        if (data.formatFrom.type === "mgrs") {
                            coordinateFormatter.load().then(function () {
                                var point = coordinateFormatter.fromMgrs(data.formatFrom.coordinates,
                                    data.spatialReference, data.formatFrom.conversionMode);

                                var result = me.getToFormatRequest(point, data, poiRequest);
                            });
                        }
                        // do usng
                        else
                            if (data.formatFrom.type === "usng") {
                                coordinateFormatter.load().then(function () {
                                    var point = coordinateFormatter.fromUsng(data.formatFrom.coordinates,
                                        data.spatialReference);

                                    var result = me.getToFormatRequest(point, data, poiRequest);
                                });
                            }
                            // do utm
                            else
                                if (data.formatFrom.type === "utm") {
                                    coordinateFormatter.load().then(function () {
                                        var point = coordinateFormatter.fromUtm(data.formatFrom.coordinates,
                                            data.spatialReference, data.formatFrom.conversionMode);

                                        var result = me.getToFormatRequest(point, data, poiRequest);
                                    });
                                }
                } else {
                */
                    if (data.addSpaces) {
                        params.addSpaces = data.addSpaces;
                    }
                    params.conversionType = data.conversionType;
                    params.calculationType = data.calculationType;
                    if (data.conversionMode) {
                        params.conversionMode = data.conversionMode;
                    }
                    if (data.numOfDigits) {
                        params.numOfDigits = data.numOfDigits;
                    }
                    if (data.rounding) {
                        params.rounding = data.rounding;
                    }
                    params.sr = data.spatialReference;

                    // call the service
                    if (data.strings) {
                        params.strings = data.strings;

                        all({
                            poiConversion: me.fromGeoCoodinateRequest(params),
                            poiRequest: me.conversionParams(caller, data)
                        }).then(me.conversionResults);
                    } else {
                        params.coordinates = data.coordinates;

                        all({
                            poiConversion: me.toGeoCoodinateRequest(params),
                            poiRequest: me.conversionParams(caller, data)
                        }).then(me.conversionResults);
                    }
                /*
                }
                */
            }

            me.conversionParams = function (caller, data) {
                return { caller: caller, request: data };
            }

            me.fromGeoCoodinateRequest = function (params) {
                var deferred = new Deferred();
                me.geometryService.fromGeoCoordinateString(params, function (result) {
                    deferred.resolve(result);
                }, me.error);
                return deferred.promise;
            }

            me.toGeoCoodinateRequest = function (params) {
                var deferred = new Deferred();
                me.geometryService.toGeoCoordinateString(params, function (result) {
                    deferred.resolve(result);
                }, me.error);
                return deferred.promise;
            }
            /*
            me.getToFormatRequest = function (point, data, poiRequest) {
                // do latlon
                if (data.formatTo.type === "latlon") {
                    coordinateFormatter.load().then(function () {
                        var result = coordinateFormatter.toLatitudeLongitude(point,
                            data.formatTo.format, data.formatTo.decimalPlaces);

                        me.conversionResults({ poiRequest: poiRequest, poiConversion: result });
                    });
                }
                // do mgrs
                else
                    if (data.formatTo.type === "mgrs") {
                        coordinateFormatter.load().then(function () {
                            var result = coordinateFormatter.toMgrs(point,
                                data.formatTo.precision, data.formatTo.addSpaces);

                            me.conversionResults({ poiRequest: poiRequest, poiConversion: result });
                        });
                    }
                    // do usng
                    else
                        if (data.formatTo.type === "usng") {
                            coordinateFormatter.load().then(function () {
                                var result = coordinateFormatter.toUsng(point,
                                    data.formatTo.precision, data.formatTo.addSpaces);

                                me.conversionResults({ poiRequest: poiRequest, poiConversion: result });
                            });
                        }
                        // do utm
                        else
                            if (data.formatTo.type === "utm") {
                                coordinateFormatter.load().then(function () {
                                    var result = coordinateFormatter.toUtm(point,
                                        data.formatTo.conversionMode, data.formatTo.addSpaces);

                                    me.conversionResults({ poiRequest: poiRequest, poiConversion: result });
                                });
                            }
            }
            */
            me.conversionResults = function (results) {
                if (results.poiConversion) {
                    /*
                    CommonMapApi.conversion.request.send(results.poiRequest, results.poiConversion);
                    */
                } else {
                    /*
                    CommonMapApi.error.send(results.poiRequest.caller, Channels.MAP_CONVERSION_REQUEST, results.poiRequest.data, "Conversion failed/invalid params");
                    */
                }
            }

            me.error = function (error) {
                /*
                CommonMapApi.error.send(null, Channels.MAP_CONVERSION_REQUEST, null, "Conversion failed/invalid params, " + JSON.stringify(error));
                */
            }
        };

        return Conversion;
    });