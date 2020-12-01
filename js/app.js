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
 */

// Entry point for map webapp
//
// NOTE: Modules that are not compatible with asynchronous module loading
// (AMD) are included in the webapp's HTML file to prevent issues.

require([
  "esri/map",
  "esri/dijit/Popup",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  "esri/dijit/Scalebar",
  "esri/geometry/Extent",
  "dojo/parser",
  "dojo/dom-class",
  "dojo/dom-construct",
  "esri/geometry/projection",
  "extensions/ViewControls",
  "extensions/home/Home",
  "extensions/search/Search",
  "notify/notify.min",
  "dojo/domReady!"
], function (
  Map,
  Popup,
  SimpleFillSymbol,
  Color,
  Scalebar,
  Extent,
  parser,
  ddomClass,
  domConstruct,
  projection,
  ViewControls,
  extHome,
  extSearch
) {
  var global = {};
  global.extensions = {};
  global.extensions.data = {};

  global.popupFill = new SimpleFillSymbol("solid", null, new Color("#A4CE67"));
  global.popup = new Popup({
    fillSymbol: global.popupFill,
    titleInBody: false
  },
    domConstruct.create("div")
  );

  global.map = new Map("map", {
    basemap: "streets",
    extent: new Extent({
      "xmin": -16045622,
      "ymin": -811556,
      "xmax": 7297718,
      "ymax": 11142818,
      "spatialReference": {
        "wkid": 102100
      }
    }),
    showLabels: true,
    infoWindow: global.popup
  });
  global.map.infoWindow.resize(350, 240);

  // add to allow double-click without zoom
  global.map.disableDoubleClickZoom();

  global.map.on("extent-change", function (evt) {
    global.redrawGraphics();
  });

  global.map.on("resize", function (evt) {
    global.redrawGraphics();
  });

  global.map.on("load", function (evt) {
    global.initialize();
    global.redrawGraphics();
  });

  global.redrawGraphics = function () {
    let graphics = global.map.graphicsLayerIds;
    let graphicLayer = null;
    for (let i = 0; i < graphics.length; i++) {
      graphicLayer = global.map.getLayer(graphics[i]);
      graphicLayer.redraw();
    }
  };

  parser.parse();

  global.scalebar = new Scalebar({
    map: global.map,
    attachTo: "bottom-left",
    scalebarUnit: "dual"
  });

  $.notify.addStyle("esri", {
    // modeled after bootstrap style
    html: "<div>\n" +
      "<div class='title' data-notify-html='title'/>\n" +
      "<span data-notify-text/>\n</div>"
  });

  $.notify.defaults({
    autoHide: false,
    clickToHide: true,
    style: "esri",
    globalPosition: "bottom right"
  });

  global.extensions.notify = {};
  global.extensions.notify.errorNotifier = function (msg) {
    $.notify(msg, {
      className: "error",
      // autoHide: true,
      // autoHideDelay: 10000
      clickToHide: true
    });
  };

  global.extensions.notify.infoNotifier = function (msg) {
    $.notify(msg, {
      className: "info",
      autoHide: true,
      autoHideDelay: 5000
    });
  };

  // see https://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html for options
  //  applicable to your deployment environment
  // Base installation - applying with a JSP available in this app.
  //  However, other options (ASP.NET, PHP) exist
  // TODO: Need means of configuring for the overall application...  Also, dealing with authentication
  esri.config.defaults.io.proxyUrl = "/Java/proxy.jsp";
  // esriConfig.defaults.io.alwaysUseProxy = false;
  // esri.config.defaults.io.proxyUrl = "https://localhost:8443/Java/proxy.jsp";

  // add projection load for global use
  const projectionPromise = projection.load();

  $("[rel=tooltip]").tooltip({
    placement: "bottom"
  });

  global.initialize = function() {
    global.extensions.viewControls = new ViewControls(global);
    global.extensions.viewControls.init();

    global.extensions.home = new extHome(global);
    global.extensions.home.init();
    $("#home").on("click", global.extensions.home.handleClick);

    global.extensions.search = new extSearch(global);
    global.extensions.search.init();
  }
});