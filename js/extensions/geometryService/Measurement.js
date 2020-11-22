define(["dojo/promise/all", "dojo/Deferred",
        "esri/request",
        "esri/kernel", "esri/tasks/AreasAndLengthsParameters", "esri/tasks/GeometryService",
        "esri/geometry/Multipoint", "esri/geometry/Point", "esri/geometry/Polygon", "esri/geometry/Polyline"
    ],
    function (all, Deferred, esriRequest, EsriNS, AreasAndLengthsParameters, GeometryService,
        Multipoint, Point, Polygon, Polyline) {
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
        var Measurement = function (adapater, map) {
            var me = this;

            /**
             * Handler for an incoming map status request.
             * @method handleRequest
             * @param caller {String} optional; the widget making the status request
             * @param data {"searchFor":...}
             * @memberof module:cmwapi-adapter/Measurement#
             */
            me.handleRequest = function (caller, data) {
                me.serve(caller, data);
            };
            /*
            CommonMapApi.measurement.request.addHandler(me.handleRequest);
            */

            /**
             * send results from measurement digit
             */
            me.send = function (event) {
                var payload = {
                    geometry: event.geometry,
                    toolName: event.toolName,
                    unitName: event.unitName,
                    values: event.values
                }
                /*
                CommonMapApi.measurement.request.send(payload);
                */
            }

            /**
             * Calculate the view details of the map and announce via the CMW-API
             * @method serve
             * @param caller {String} The Id of the widget which requested the map view status
             * @memberof module:cmwapi-adapter/Measurement#
             */
            me.serve = function (caller, data) {
                me.geometryService = new GeometryService(window.esriGeometryService);

                var areasAndLengthParams = new AreasAndLengthsParameters();
                areasAndLengthParams.lengthUnit = me.unitConstant(data.lengthUnit);
                areasAndLengthParams.areaUnit = me.unitConstant(data.areaUnit);
                if (data.calculationType) {
                    areasAndLengthParams.calculationType = data.calculationType;
                }

                // create geometry type based on type
                var geometry;
                if (data.geometry.type === "multipoint") {
                    geometry = new Multipoint(data.geometry);
                } else
                if (data.geometry.type === "point") {
                    geometry = new Point(data.geometry);
                } else
                if (data.geometry.type === "polygon") {
                    geometry = new Polygon(data.geometry);
                } else
                if (data.geometry.type === "polyline") {
                    geometry = new Polyline(data.geometry);
                }

                // call the service (simplify)
                all({
                    poiSimplify: me.measurementSimplifyRequest(geometry, areasAndLengthParams),
                    poiRequest: me.measurementParams(caller, data)
                }).then(me.simplifyResults);

                //geometryService.simplify([geometry], function (simplifiedGeometries) {
                //    areasAndLengthParams.polygons = simplifiedGeometries;
                //    geometryService.areasAndLengths(areasAndLengthParams);
                //}, me.error);
            }

            me.measurementParams = function(caller, data) {
                return {caller: caller, request: data};
            }

            me.measurementSimplifyRequest = function(geometry, areasAndLengthParams) {
                var deferred = new Deferred();
                me.geometryService.simplify([geometry], function (simplifiedGeometries) {
                    areasAndLengthParams.polygons = simplifiedGeometries;

                    var results = {};
                    results.simplifiedGeometries = simplifiedGeometries;
                    results.areasAndLengthParams = areasAndLengthParams;
                    deferred.resolve(results);
                }, me.error);
                return deferred.promise;            
            }

            me.unitConstant = function (textUnit) {
                textUnit = textUnit.toUpperCase();

                if (textUnit === "ACRES") {
                    return GeometryService.UNIT_ACRES;
                } else
                if (textUnit === "SQ MILES") {
                    return GeometryService.UNIT_SQUARE_MILES;
                } else
                if (textUnit === "SQ KILOMETERS") {
                    return GeometryService.UNIT_SQUARE_KILOMETERS;
                } else
                if (textUnit === "HECTARES") {
                    return GeometryService.UNIT_HECTARES;
                } else
                if (textUnit === "SQ YARDS") {
                    return GeometryService.UNIT_SQUARE_YARDS;
                } else
                if (textUnit === "SQ FEET") {
                    return GeometryService.UNIT_SQUARE_FEET;
                } else
                if (textUnit === "SQ METERS") {
                    return GeometryService.UNIT_SQUARE_METERS;
                } else
                if (textUnit === "MILES") {
                    return GeometryService.UNIT_STATUTE_MILE;
                } else
                if (textUnit === "KILOMETERS") {
                    return GeometryService.UNIT_KILOMETER;
                } else
                if (textUnit === "FEET") {
                    return GeometryService.UNIT_FOOT;
                } else
                if (textUnit === "METERS") {
                    return GeometryService.UNIT_METER;
                } else
                if (textUnit === "NAUTICAL MILES") {
                    return GeometryService.UNIT_NAUTICAL_MILE;
                }
            }

            me.simplifyResults = function (results) {
                // call the service (simplify)
                all({
                    poiMeasurement: me.measurementMeasureRequest(results.poiSimplify.areasAndLengthParams),
                    poiRequest: me.measurementParams(results.poiRequest.caller, results.poiRequest.request)
                }).then(me.measurementResults);
            }

            me.measurementMeasureRequest = function(areasAndLengthParams) {
                var deferred = new Deferred();
                me.geometryService.areasAndLengths(areasAndLengthParams, function(results) {
                    deferred.resolve(results);
                }, me.error);
                return deferred.promise;            
            }

            me.measurementResults = function (results) {
                if (results) {
                    /*
                    CommonMapApi.measurement.request.send(results.poiRequest, results.poiMeasurement);
                    */
                } else {
                    /*
                    CommonMapApi.error.send(results.poiRequest.caller, Channels.MAP_MEASUREMENT_REQUEST, results.poiRequest.data, "Calculation failed/invalid geometry");
                    */
                }
            }

            me.error = function (error) {
                /*
                CommonMapApi.error.send(null, Channels.MAP_MEASUREMENT_REQUEST, null, "Conversion failed/invalid params, " + JSON.stringify(error));
                */
            }
        };

        return Measurement;
    });