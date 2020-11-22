define(["esri/kernel", "esri/geometry/Extent", "app/extensions/ViewUtils"],
    function (EsriNS, Extent, ViewUtils) {
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
        var Status = function (adapter, map) {
            var me = this;
            me.coordinateFormat = 'DMM';
            /**
             * Handler for an incoming map status request.
             * @method handleRequest
             * @param caller {String} optional; the widget making the status request
             * @param types {String[]} optional; the types of status being requested. Array of strings;
             *      1.1 only supports "about", "format", and "view"
             * @memberof module:cmwapi-adapter/Status#
             */
            me.handleStatusRequest = function (caller, msg) {
                if (!msg.hasOwnProperty("types")) {
                    me.handleMapIdRequest(caller, msg);
                    return;
                }

                if (!msg || !msg.types) {
                    me.sendView(caller);
                    me.sendAbout(caller);
                    me.sendFormat(caller);
                } else {
                    for (var i = 0; i < msg.types.length; i++) {
                        if (msg.types[i] === "view") {
                            me.sendView(caller);
                        } else if (msg.types[i] === "about") {
                            me.sendAbout(caller);
                        } else if (msg.types[i] === "format") {
                            me.sendFormat(caller);
                        } else if (msg.types[i] === "mapid") {
                            me.sendMapId(caller);
                        }
                    }
                }
            };
            /*
            CommonMapApi.status.request.addHandler(me.handleStatusRequest);
            */

            /**
             * Calculate the view details of the map and announce via the CMW-API
             * @method sendView
             * @param caller {String} The Id of the widget which requested the map view status
             * @memberof module:cmwapi-adapter/Status#
             */
            me.sendView = function (caller) {
                if (map.geographicExtent === undefined) {
                    // The map is still loading
                    // This can happen if a widget loads and asks for the maps current status prior to the map being ready.
                    setTimeout(function () {
                        me.sendView(caller);
                    }, 1000);
                    return;
                }
                var bounds = {
                    southWest: {
                        lat: map.geographicExtent.ymin,
                        lon: Extent.prototype._normalizeX(map.geographicExtent.xmin, map.geographicExtent.spatialReference._getInfo()).x
                    },
                    northEast: {
                        lat: map.geographicExtent.ymax,
                        lon: Extent.prototype._normalizeX(map.geographicExtent.xmax, map.geographicExtent.spatialReference._getInfo()).x
                    }
                };

                var center = {
                    lat: map.geographicExtent.getCenter().y,
                    lon: Extent.prototype._normalizeX(map.geographicExtent.getCenter().x, map.geographicExtent.spatialReference._getInfo()).x
                };

                var range = ViewUtils.scaleToZoomAltitude(map);

                var scale = map.getScale();
                var zoom = map.getZoom();
                var basemap = map.getBasemap();
                var timeExtent = map.timeExent;
                if (timeExtent === undefined) {
                    timeExtent = "";
                }
                var spatialReference = map.spatialReference;

                /*
                CommonMapApi.status.view.send({
                    bounds: bounds,
                    center: center,
                    range: range,
                    scale: scale,
                    zoom: zoom,
                    basemap: basemap,
                    spatialReference: spatialReference,
                    timeExtent: timeExtent,
                    requester: caller,
                    coordinateFormat: me.coordinateFormat
                });
                */
            };

            /**
             * Compile the map about details and announce via the CMW-API
             * @method sendAbout
             * @param caller {Object} The Id of the widget which requested the map view status
             * @memberof module:cmwapi-adapter/Status#
             */
            me.sendAbout = function () {
                var version = "1.0.0"; // CommonMapApi.version;
                var type = "2-D";
                // var widgetName = OWF.getInstanceId();

                /*
                CommonMapApi.status.about.send({
                    version: version,
                    type: type,
                    widgetName: widgetName
                });
                */
            };

            /**
             * Announce the accepted formats via the CMW-API
             * @method sendFormat
             * @param caller {object} The Id of the widget which requested the map view status
             * @memberof module:cmwapi-adapter/Status#
             */
            me.sendFormat = function () {
                var formats = ["kml", "GeoJSON", "wms", "arcgis-dynamicmapservice", "arcgis-imageservice", "arcgis-feature"];

                /*
                CommonMapApi.status.format.send({
                    formats: formats
                });
                */
            };

            /**
             * Send the current id of the map
             * @method sendMapId
             * @param caller {object} The Id of the widget which requested the map view status
             * @memberof module:cmwapi-adapter/Status#
             */
            me.sendMapId = function () {
                var payload = {};
                payload.mapId = window.cmwapiMapId;
                payload.datetime = window.cmwapiDatetime.getTime();

                /*
                CommonMapApi.status.mapid.send(payload);
                */
            };

            me.requestMapId = function () {
                /*
                CommonMapApi.status.mapid.sendRequest();
                */
            };
            /**
             * Sets the current coordinate format and sends a status update.
             * @method setCoordinateFormat
             * @param format The coordinate format to set the status to.
             * @memberof module:cmwapi-adapter/Status#
             */
            me.setCoordinateFormat = function (format) {
                me.coordinateFormat = format;
                if (map.loaded) {
                    /*
                    me.sendView(OWF.getInstanceId());
                    */
                }
            };
        };
        return Status;
    });