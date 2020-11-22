define(["dojo/promise/all",
        "esri/request",
        "esri/kernel", "esri/dijit/BookmarkItem"
    ],
    function (all, esriRequest, EsriNS, BookmarkItem) {
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
        var Bookmark = function (adapater, payload) {
            var me = this;

            /**
             * Calculate the view details of the map and announce via the CMW-API
             * @method serve
             * @param caller {String} The Id of the widget which requested the map view status
             * @memberof module:cmwapi-adapter/Bookmark#
             */
            me.caller = null;
            me.data = {};
            me.serve = function (caller, action, data) {
                me.caller = caller;
                me.data = data;

                if (action === "remove") {
                    $.each(data.name, function(index, item) {
                        payload.bookmarks.removeBookmark(item);
                    });
                } else
                if (action === "add") {
                    payload.bookmarks.addBookmark(new BookmarkItem(data));
                } else
                if (action === "notify") {
                    if (caller !== OWF.getInstanceId()) {
                        me.blockSenders = true;

                        // remove old bookmarks
                        var oldBookmarks = JSON.parse(JSON.stringify(payload.bookmarks.bookmarks));
                        $.each(oldBookmarks, function(index, item) {
                            payload.bookmarks.removeBookmark(item.name);
                        });

                        // add the items from notify message
                        var newBookmarks = data.bookmarks;
                        $.each(newBookmarks, function(index, item) {
                            payload.bookmarks.addBookmark(new BookmarkItem(item));
                        });

                        me.blockSenders = false;                        
                    }
                }

                // save the state
                me.saveView();
            }

            /**
             * saves the bookmarks in an OWF user preference
             * @method saveView
             * @memberof module:cmwapi-adapter/Bookmark#
             */
            me.saveView = function () {
                var bookmarkArray = JSON.stringify(payload.bookmarks.bookmarks);

                var successHandler = function () {
                    // Empty example handler.  No action required.
                };
                var failureHandler = function () {
                    /*
                    CommonMapApi.error.send({
                        sender: OWF.getInstanceId(),
                        type: "internal error",
                        msg: "Unable to archive bookmarks",
                        error: "Error: " + e
                    });
                    */
                };
                /*
                OWFWidgetExtensions.Preferences.setWidgetInstancePreference({
                    namespace: OVERLAY_PREF_NAMESPACE,
                    name: OVERLAY_PREF_NAME,
                    value: bookmarkArray,
                    onSuccess: successHandler,
                    onFailure: failureHandler
                });
                */
            };

            /**
             * restores the bookmarks in an OWF user preference
             * @method restoreView
             * @memberof module:cmwapi-adapter/Bookmark#
             */
            me.restoreView = function () {
                var successHandler = function (retValue) {
                    if (retValue && retValue.value) {
                        var bmarks = JSON.parse(retValue.value);
                        dojo.forEach(bmarks, function (b) {
                            payload.bookmarks.addBookmark(b);
                        });
                    }
                };

                var failureHandler = function (e) {
                    /*
                    CommonMapApi.error.send({
                        sender: OWF.getInstanceId(),
                        type: "internal error",
                        msg: "Error in getting bookmarks",
                        error: "Error: " + e
                    });
                    */
                };
                /*
                OWFWidgetExtensions.Preferences.getWidgetInstancePreference({
                    namespace: OVERLAY_PREF_NAMESPACE,
                    name: OVERLAY_PREF_NAME,
                    onSuccess: successHandler,
                    onFailure: failureHandler
                });
                */
            }

        };

        return Bookmark;
    });