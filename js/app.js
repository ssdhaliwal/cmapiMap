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
  "dojo/parser",
  "esri/geometry/projection",
  "esri/layers/FeatureLayer",
  "extensions/notify/Notify",
  "extensions/toolbar/Toolbar",
  "extensions/config/Config",
  "extensions/popup/Popup",
  "extensions/map/Map",
  "extensions/scalebar/Scalebar",
  "extensions/home/Home",
  "extensions/search/Search",
  "extensions/basemap/Basemap",
  "extensions/legend/Legend",
  "extensions/bookmarks/Bookmarks",
  "dojo/domReady!"
], function (
  parser,
  projection,
  FeatureLayer,
  extNotify,
  extToolbar,
  extConfig,
  extPopup,
  extMap,
  extScalebar,
  extHome,
  extSearch,
  extBasemap,
  extLegend,
  extBookmarks
) {
  var global = {};
  global.extensions = {};
  global.data = {};

  parser.parse();

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

  global.extensions.extMap = { map: {} };
  global.extensions.extNotify = new extNotify(global);
  global.extensions.extNotify.init();
  global.extensions.extToolbar = new extToolbar(global);
  global.extensions.extToolbar.init();
  global.extensions.extConfig = new extConfig(global);
  global.extensions.extConfig.init();
  global.extensions.extPopup = new extPopup(global);
  global.extensions.extPopup.init();
  global.extensions.extMap = new extMap(global);
  global.extensions.extMap.init();

  global.initialize = function () {
    global.extensions.extScalebar = new extScalebar(global);
    global.extensions.extScalebar.init();
    global.extensions.extHome = new extHome(global);
    global.extensions.extHome.init();
    global.extensions.extSearch = new extSearch(global);
    global.extensions.extSearch.init();
    global.extensions.extBasemap = new extBasemap(global);
    global.extensions.extBasemap.init();
    global.extensions.extLegend = new extLegend(global);
    global.extensions.extLegend.init();
    global.extensions.extBookmarks = new extBookmarks(global);
    global.extensions.extBookmarks.init();

    window.setTimeout(() => {
      let rivers = new FeatureLayer("https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Hydrography/Watershed173811/MapServer/1", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
      });
      let waterbodies = new FeatureLayer("https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Hydrography/Watershed173811/MapServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
      });

      global.extensions.extMap.map.addLayers([waterbodies, rivers]);
    }, 1000);
  }
});