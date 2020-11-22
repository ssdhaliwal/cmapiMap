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
 *  Overlay Mananger
 *  This module applies a manager interface to the map which allows a user to
 *  add, remove or manipulate various types of feature layers.
 */
define(["dijit/form/Button",        
        "esri/graphic",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/layers/GraphicsLayer",
        "esri/dijit/editing/Editor",
        "esri/dijit/editing/TemplatePicker", ],
        function (Button, Graphic, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, GraphicsLayer, Editor, TemplatePicker) {

            /**
             * Draw tools that will be placed on the map.
             * @constructor
             * @param map {object} ESRI map object for which this Overlay Manager should apply
             * @param errorNotifier {module:cmwapi-adapter/errorNotifier}
             * @param notifier {module:cmwapi-adapter/notifier}
             * @alias module:digits/OverlayManager
             */
            var Edit = function (data) {

                //The draw html is populated from a template @ /feature/EditTool/draw.html
                $('#edit_wrapper').load('./digits/edit/index.html', function () {                    
                    map = data.map;
                    overlayManager = data.overlayManager;                    
                });
            };
            
            return Edit;
        });
