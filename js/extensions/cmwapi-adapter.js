define(["app/extensions/Overlay", "app/extensions/Feature", "app/extensions/Status",
    "app/extensions/View", "app/extensions/Error", "app/extensions/EsriOverlayManager", "app/extensions/Portal",
    "esri/geometry/webMercatorUtils",
    "app/extensions/geometryService/Geocoder", "app/extensions/geometryService/Measurement", "app/extensions/geometryService/Conversion",
    "app/extensions/Bookmark", "app/extensions/MousePosition", "app/extensions/JSUtils"
],
    function (Overlay, Feature, Status, View, Error, OverlayManager, Portal, webMercatorUtils,
        Geocoder, Measurement, Conversion, Bookmark, MousePosition, JSUtils) {
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
         * @description Adapter layer between Common Map Widget API v. 1.1 javascript
         *  implementation and ESRI map implementations
         *
         * @version 1.1
         *
         * @module cmwapi-adapter/cmwapi-adapter
         */

        /**
         * @constructor
         * @param map {object} ESRI map object for which this adapter should apply
         * @param errorNotifier
         * @param infoNotifier
         * @alias module:cmwapi-adapter/cmwapi-adapter
         */
        var EsriAdapter = function (payload, errorNotifier, notifier) {
            // Capture 'this' for use in custom event handlers.
            var me = this;
            var initPayload = {};
            initPayload.status = "init";
            /*
            CommonMapApi.status.initialization.send(initPayload);
            */

            //Keep track of the mouse location on mouse up events to handle drag and drop.
            var mouseLocation;

            /**
             * Handles click events on an ArcGIS map and reports the event over a CMWAPI channel.
             * @private
             * @method sendClick
             * @param {MouseEvent} evt A MouseEvent fired by an ArcGIS map.  This is essentially a DOM MouseEvent
             *     with added, ArcGIS-specific attributes.
             * @param {String} type Should be either {@link module:cmwapi/map/view/Clicked.SINGLE|SINGLE} or
             *    {@link module:cmwapi/map/view/Clicked.DOUBLE|DOUBLE}; Default is the former value.
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var sendClick = function (evt, type) {
                var payload = {};
                var keys = [];

                // Calculate lat/lon from event's MapPoint.
                payload.lat = evt.mapPoint.getLatitude();
                payload.lon = evt.mapPoint.getLongitude();
                
                // Determine the keys selected during a mouse click.
                /*
                if (evt.altKey) {
                    keys.push(CommonMapApi.view.clicked.ALT);
                }
                if (evt.shiftKey) {
                    keys.push(CommonMapApi.view.clicked.SHIFT);
                }
                if (evt.ctrlKey) {
                    keys.push(CommonMapApi.view.clicked.CTRL);
                }
                if (keys.length === 0) {
                    keys.push(CommonMapApi.view.clicked.NONE);
                }
                payload.keys = keys;

                // Take the input type.
                payload.type = (typeof type !== "undefined") ? type : CommonMapApi.view.clicked.SINGLE;

                // Determine the button clicked.
                if (evt.button === 0) {
                    payload.button = CommonMapApi.view.clicked.LEFT;
                } else if (evt.button === 1) {
                    payload.button = CommonMapApi.view.clicked.MIDDLE;
                } else if (evt.button === 2) {
                    payload.button = CommonMapApi.view.clicked.RIGHT;
                } else {
                    // Simply return without sending a click.  We're not interested in
                    // other buttons for now.  If we send this anyway without a button
                    // specified, the value may be interpreted as a "left" button by
                    // any widgets using an older CMWAPI implementation.
                    return false;
                }
                */

                /*
                CommonMapApi.view.clicked.send(payload);
                */
            };

            /**
             * Handles click events on an ArcGIS map and reports the event over a CMWAPI channel.
             * @private
             * @method sendMousedown
             * @param {MouseEvent} evt A MouseEvent fired by an ArcGIS map.  This is essentially a DOM MouseEvent
             *     with added, ArcGIS-specific attributes.
             * @param {String} type Should be either {@link module:cmwapi/map/view/Clicked.SINGLE|SINGLE} or
             *    {@link module:cmwapi/map/view/Clicked.DOUBLE|DOUBLE}; Default is the former value.
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var sendMousedown = function (evt, type) {
                var payload = {};
                var keys = [];

                // Calculate lat/lon from event's MapPoint.
                payload.lat = evt.mapPoint.getLatitude();
                payload.lon = evt.mapPoint.getLongitude();

                // Determine the keys selected during a mouse click.
                /*
                if (evt.altKey) {
                    keys.push(CommonMapApi.view.mousedown.ALT);
                }
                if (evt.shiftKey) {
                    keys.push(CommonMapApi.view.mousedown.SHIFT);
                }
                if (evt.ctrlKey) {
                    keys.push(CommonMapApi.view.mousedown.CTRL);
                }
                if (keys.length === 0) {
                    keys.push(CommonMapApi.view.mousedown.NONE);
                }
                payload.keys = keys;

                // Take the input type.
                payload.type = (typeof type !== "undefined") ? type : CommonMapApi.view.mousedown.SINGLE;

                // Determine the button clicked.
                if (evt.button === 0) {
                    payload.button = CommonMapApi.view.mousedown.LEFT;
                } else if (evt.button === 1) {
                    payload.button = CommonMapApi.view.mousedown.MIDDLE;
                } else if (evt.button === 2) {
                    payload.button = CommonMapApi.view.mousedown.RIGHT;
                } else {
                    // Simply return without sending a click.  We're not interested in
                    // other buttons for now.  If we send this anyway without a button
                    // specified, the value may be interpreted as a "left" button by
                    // any widgets using an older CMWAPI implementation.
                    return false;
                }
                */
                /*
                CommonMapApi.view.mousedown.send(payload);
                */
            };

            /**
             * Handles click events on an ArcGIS map and reports the event over a CMWAPI channel.
             * @private
             * @method sendMouseup
             * @param {MouseEvent} evt A MouseEvent fired by an ArcGIS map.  This is essentially a DOM MouseEvent
             *     with added, ArcGIS-specific attributes.
             * @param {String} type Should be either {@link module:cmwapi/map/view/Clicked.SINGLE|SINGLE} or
             *    {@link module:cmwapi/map/view/Clicked.DOUBLE|DOUBLE}; Default is the former value.
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var sendMouseup = function (evt, type) {
                var payload = {};
                var keys = [];

                // Calculate lat/lon from event's MapPoint.
                payload.lat = evt.mapPoint.getLatitude();
                payload.lon = evt.mapPoint.getLongitude();

                // Determine the keys selected during a mouse click.
                /*
                if (evt.altKey) {
                    keys.push(CommonMapApi.view.mouseup.ALT);
                }
                if (evt.shiftKey) {
                    keys.push(CommonMapApi.view.mouseup.SHIFT);
                }
                if (evt.ctrlKey) {
                    keys.push(CommonMapApi.view.mouseup.CTRL);
                }
                if (keys.length === 0) {
                    keys.push(CommonMapApi.view.mouseup.NONE);
                }
                payload.keys = keys;

                // Take the input type.
                payload.type = (typeof type !== "undefined") ? type : CommonMapApi.view.mouseup.SINGLE;

                // Determine the button clicked.
                if (evt.button === 0) {
                    payload.button = CommonMapApi.view.mouseup.LEFT;
                } else if (evt.button === 1) {
                    payload.button = CommonMapApi.view.mouseup.MIDDLE;
                } else if (evt.button === 2) {
                    payload.button = CommonMapApi.view.mouseup.RIGHT;
                } else {
                    // Simply return without sending a click.  We're not interested in
                    // other buttons for now.  If we send this anyway without a button
                    // specified, the value may be interpreted as a "left" button by
                    // any widgets using an older CMWAPI implementation.
                    return false;
                }
                */
                /*
                CommonMapApi.view.mouseup.send(payload);
                */
            };

            /**
             * Handles double click events on an ArcGIS map and reports the event over a CMWAPI channel.
             * @private
             * @method sendDoubleClick
             * @param {MouseEvent} evt A MouseEvent fired by an ArcGIS map.  This is
             *  essentially a DOM MouseEvent with added, ArcGIS-specific attributes.
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var sendDoubleClick = function (evt) {
                /*
                sendClick(evt, CommonMapApi.view.clicked.DOUBLE);
                */

                // updatge quickIcon if enabled
                if ($("#qiIPEDITCOORDCH").hasClass("qiMapSelectionOn")) {
                    $("#qiIPEDITFormatType").val("DECIMAL").change();

                    //the map is in web mercator but display coordinates in geographic (lat, lon)
                    var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);

                    //display mouse coordinates
                    var mapLastX = mp.x.toFixed(5);
                    var mapLastY = mp.y.toFixed(5);

                    var lat = Number(mapLastY);
                    lat = lat + ((lat >= 0) ? "N" : "S");
                    var lon = Number(mapLastX);
                    lon = lon + ((lat >= 0) ? "E" : "W");
                    $("#qiIPEDITCOORDDECIMAL01").val(lat);
                    $("#qiIPEDITCOORDDECIMAL02").val(lon);

                    map.QuickIcon.plotTemporaryIcon({key: "Enter"}, null, null, null);
                }
            };

            /**
             * Handles click events on an ArcGIS map and reports the event over a CMWAPI channel.
             * @private
             * @method sendInit
             * @param {MouseEvent} evt A MouseEvent fired by an ArcGIS map.  This is essentially a DOM MouseEvent
             *     with added, ArcGIS-specific attributes.
             * @param {String} type Should be either {@link module:cmwapi/map/view/Clicked.SINGLE|SINGLE} or
             *    {@link module:cmwapi/map/view/Clicked.DOUBLE|DOUBLE}; Default is the former value.
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var sendInitialization = function (status) {
                var payload = {};
                payload.status = status;
                /*
                CommonMapApi.status.initialization.send(payload);
                */
            };

            var sendInit = function () {
                window.mapInitSent = true;
                sendInitialization("init");

                // send request for map sync
                me.status.requestMapId();

                me.view.setInitialView();
                me.bookmark.restoreView();
            };
            var sendReady = function () {
                if (!window.mapInitSent) {
                    sendInit();
                }
                sendInitialization("ready");
            };
            var sendTeardown = function () {
                me.overlayManager.overlay.removeAllOverlays();
                sendInitialization("tearDown");
            };
            var sendMapswap = function () {
                sendInitialization("mapSwapinProgress");
            };

            /**
             * Handles drag and drop events over the OWF DragAndDrop API.
             * @private
             * @method sendDragAndDrop
             * @param {MouseEvent} evt A MouseEvent fired by OWF.  This is essentially a DOM MouseEvent
             *  with added, OWF-specific attributes.
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var sendDragAndDrop = function (evt) {
                var callerId = JSON.parse(evt.dragSourceId).id;
                var overlayId = evt.dragDropData.overlayId || JSUtils.uuidv4();
                var featureId = evt.dragDropData.featureId;
                var name = evt.dragDropData.name;
                var zoom = JSUtils.getBoolean(evt.dragDropData.zoom) ? true : false;
                var payload = {};
                payload.featureId = featureId;
                if (evt.dragDropData.marker) {
                    payload.marker = {
                        id: evt.dragDropData.marker.id,
                        description: evt.dragDropData.marker.description,
                        iconUrl: evt.dragDropData.marker.iconUrl,
                        latlon: {
                            lon: mouseLocation.mapPoint.getLongitude(),
                            lat: mouseLocation.mapPoint.getLatitude()
                        },
                        attributes: evt.dragDropData.marker.attributes,
                        quickIcon: evt.dragDropData.marker.quickIcon,
                        iconSize: (evt.dragDropData.marker.iconSize || "small"),
                        zoom: (evt.dragDropData.marker.zoom || false)
                    };
                }
                if (evt.dragDropData.feature) {
                    payload.feature = {
                        format: evt.dragDropData.feature.format,
                        featureData: evt.dragDropData.feature.featureData
                    };
                }
                if (evt.dragDropData.featureUrl) {
                    payload.featureUrl = {
                        format: evt.dragDropData.featureUrl.format,
                        url: evt.dragDropData.featureUrl.url,
                        params: evt.dragDropData.featureUrl.params
                    };
                }
                //Perform validation of the payload and verify that it contains the required fields
                var payloadValidation = payload; // CommonMapApi.validator.validDragAndDropPayload(payload);
                if (payloadValidation.result === true && mouseLocation) {
                    //payload contains a marker.
                    if (payload.marker) {
                        me.overlayManager.feature.plotMarker(callerId, overlayId, featureId, name, payload.marker, zoom);
                    }
                    //payload contains a feature string.
                    if (payload.feature) {
                        me.overlayManager.feature.plotFeature(
                            callerId,
                            overlayId,
                            featureId,
                            name,
                            payload.feature.format,
                            payload.feature.featureData,
                            zoom);
                    }
                    // payload contains a feature url.
                    if (payload.featureUrl) {
                        me.overlayManager.feature.plotFeatureUrl(
                            callerId,
                            overlayId,
                            featureId,
                            name,
                            payload.featureUrl.format,
                            payload.featureUrl.url,
                            payload.featureUrl.params,
                            zoom);
                    }
                    // Save the manager state.
                    //me.overlayManager.archiveState();
                    mouseLocation = null;
                } else {
                    me.error.error(callerId, payloadValidation.msg, {
                        type: "map.feature.dragAndDrop",
                        msg: payloadValidation.msg
                    });
                }
            };

            /**
             * Reports out changes in an ArcGIS map extent according to the CMWAPI
             *  map.status.view channel definition.
             * @private
             * @method sendStatusViewUpdate
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var sendStatusViewUpdate = function () {
                /*
                me.status.sendView(OWF.getInstanceId());
                */
                me.mousePosition.showCoordinates(null);
            };

            /**
             * Updates the mouse location on mouse up events, to get to location for drag and drop
             * @private
             * @method updateMouseLocation
             * @param location {MouseEvent} The MouseEvent generated by the click mouseUp
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var updateMouseLocation = function (location) {
                mouseLocation = location;

                // update QuickIcon move
                if (map.QuickIcon.dragging) {
                    map.QuickIcon.dragging = false;

                    map.setMapCursor("auto");
                    sendDragAndDrop({
                        "dragSourceId": JSON.stringify({"id":"\"" + JSUtils.uuidv4() + "\""}),
                        "dragDropLabel": map.QuickIcon.draggingMarker.attributes.name,
                        "dragDropData": {
                            overlayId: "Quick Icon",
                            featureId: map.QuickIcon.draggingMarker.attributes.featureId,
                            name: map.QuickIcon.draggingMarker.attributes.name,
                            zoom: map.QuickIcon.draggingMarker.zoom,
                            marker: map.QuickIcon.draggingMarker
                        },
                        "dropTarget": $("div#map_layers.esriMapLayers")[0]
                    });
                }
            };

            /**
             * Notifies OWF that the map is compatible with the drag and drop api
             *  when a drag event is brought onto the map.
             * @private
             * @method setDropEnabled
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var setDropEnabled = function () {
                try {
                    /*
                    OWF.DragAndDrop.setDropEnabled(true);
                    */
                } catch (err) {
                    if (err === "Ozone.util.parseJson expected a string, but didn't get one") {
                        //This error is not an issue. Do nothing.
                    } else {
                        throw err;
                    }
                }
            };

            /**
             * Notifies OWF that the map is no longer compatible with the drag and
             *  drop api when it is dragged outside of the map.
             * @private
             * @method setDropDisabled
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            var setDropDisabled = function () {
                /*
                OWF.DragAndDrop.setDropEnabled(false);
                */
            };

            /**
             * An event unloader. It removes our custom handlers from an ArcGIS map object.
             * @private
             * @method unloadHandlers
             * @memberof module:cmwapi-adapter/cmwapi-adapter#
             */
            var unloadHandlers = function () {
                me.clickHandler.remove();
                me.mousedownHandler.remove();
                me.mouseupHandler.remove();
                me.dblClickHandler.remove();
                me.extentChangeHandler.remove();
                me.upClickHandler.remove();
                me.dropEnabledHandler.remove();
                me.dropDisabledHandler.remove();
                me.unloadMapHandler.remove();
                me.mouseMoveHandler.remove();
            };
            this.overlayManager = new OverlayManager(payload, errorNotifier, notifier);
            //this.overlayManager.retrieveState();

            // Attach any exposed instance attributes.
            /**
             * @see module:cmwapi-adapter/Overlay
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.overlay = new Overlay(this, this.overlayManager);
            /**
             * @see module:cmwapi-adapter/Feature
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.feature = new Feature(this, this.overlayManager, payload.map);
            /**
             * @see module:cmwapi-adapter/Status
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.status = new Status(this, payload.map);
            /**
             * @see module:cmwapi-adapter/MousePosition
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.mousePosition = new MousePosition(payload.map, this.status);
            /**
             * @see module:cmwapi-adapter/View
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.view = new View(payload.map, this.overlayManager);
            /**
             * @see module:cmwapi-adapter/Error
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.error = new Error(this);
            /**
             * @see module:cmwapi-adapter/geometryService/Geocoder
             * @memberof! module:cmwapi-adapter/geometryService/cmwapi-adapter#
             */
            this.geocoder = new Geocoder(this, payload.map);
            /**
             * @see module:cmwapi-adapter/geometryService/Measurement
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.measurement = new Measurement(this, payload.map);
            /**
             * @see module:cmwapi-adapter/geometryService/Conversion
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.conversion = new Conversion(this, payload.map);
            /**
             * @see module:cmwapi-adapter/map/Bookmark
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.bookmark = new Bookmark(this, payload);

            /** TODO:
             * THIS WILL BE FOR PORTAL!!!!!!!!!!!!!!!!!!!!
             * @see module:cmwapi-adapter/Portal
             * @memberof! module:cmwapi-adapter/cmwapi-adapter#
             */
            this.portal = new Portal(payload);

            // Attach any custom map handlers.
            this.initStatusHandler = payload.map.on("load", sendInit);
            //this.initStatusHandler = payload.map.on("basemap-change", sendInit);
            this.readyStatusHandler = payload.map.on("update-end", sendReady);
            this.teardownStatusHandler = payload.map.on("before-unload", sendTeardown);
            this.mapswapStatusHandler = payload.map.on("basemap-change", sendMapswap);
            this.clickHandler = payload.map.on("click", sendClick);
            this.mousedownHandler = payload.map.on("mouse-down", sendMousedown);
            this.mouseupHandler = payload.map.on("mouse-up", sendMouseup);
            this.dblClickHandler = payload.map.on("dbl-click", sendDoubleClick);
            this.extentChangeHandler = payload.map.on("extent-change", sendStatusViewUpdate);
            this.upClickHandler = payload.map.on('mouse-up', updateMouseLocation);
            this.dropEnabledHandler = payload.map.on('mouse-over', setDropEnabled);
            this.dropDisabledHandler = payload.map.on('mouse-out', setDropDisabled);
            this.unloadMapHandler = payload.map.on("unload", unloadHandlers);
            this.mouseMoveHandler = payload.map.on("mouse-move", this.mousePosition.showCoordinates);
            this.mouseMoveHandler = payload.map.on("mouse-drag", this.mousePosition.showCoordinates);
            //payload.map.on('load', this.view.setInitialView);
            //payload.map.on('load', this.feature.testLoad);

            // set event for measurement
            payload.measurement.on("measure-end", function (event) {
                me.measurement.send(event);
            });

            // set event for measurement
            //payload.bookmarks.on("click", function(event) {
            //    me.bookmark.send("click", event);
            //});
            payload.bookmarks.on("edit", function (event) {
                me.bookmark.send("edit", event);
            });
            payload.bookmarks.on("remove", function (event) {
                me.bookmark.send("remove", event);
            });

            //Attach drop zone handler to OWF.
            /*
            OWF.DragAndDrop.addDropZoneHandler({
                dropZone: payload.map.root,
                handler: sendDragAndDrop
            });
            */
        };

        return EsriAdapter;
    });