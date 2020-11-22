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
define([], function() {
    var adapter;
    var infoNotifier;

    /**
     * When the Overlay Manager is instantiated it will create the overlay tree, update it with
     * the current values for overlays and features from the hen bind to all events
     * for actions within the manager.
     * @constructor
     * @param map {object} ESRI map object for which this Overlay Manager should apply
     * @param errorNotifier {module:errorNotifier}
     * @param notifier {module:notifier}
     * @alias module:digits/OverlayManager
     */
    var Edit =  function(data, errorNotifier, notifier) {
        infoNotifier = notifier;        

        //The manager html is populated from a template @ /digits/overlayManager/index.html
        $('#edit_wrapper').load('./digits/edit/index.html', function() {            
        });
    };

    //Only method avaiable outside of the scope of OverlayManager, this is to hook into the button
    //on the map to allow the manager to open and close.
    Edit.prototype.toggleEdit = function() {
        $('#basemaps_wrapper, #overlay_wrapper, #about_wrapper, #batchselect_wrapper, #draw_wrapper, #bookmark_wrapper, #measure_wrapper').hide();
        $('#basemaps, #overlay, #about, #batchselect, #legend, #draw, #bookmark, #measure').removeClass('selected');

        $('#edit').toggleClass('selected');
        $('#edit_wrapper').toggle();
    };

    return Edit;
});
