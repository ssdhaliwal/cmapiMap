// Entry point for map webapp

// NOTE: Modules that are not compatible with asynchronous module loading
// (AMD) are included in the webapp's HTML file to prevent issues.

require([
  "dojo/parser",
  "esri/geometry/projection",
  "plugins/notify/Notify",
  "plugins/toolbar/Toolbar",
  "plugins/config/Config",
  "plugins/popup/Popup",
  "plugins/map/Map",
  "plugins/scalebar/Scalebar",
  "plugins/home/Home",
  "plugins/search/Search",
  "plugins/basemap/Basemap",
  "plugins/legend/Legend",
  "plugins/bookmarks/Bookmarks",
  "plugins/layerlist/Layerlist",
  "interface/messageService",
  "dojo/domReady!"
], function (
  parser,
  projection,
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
  extBookmarks,
  extLayerlist,
  messageService
) {
  var global = {};
  global.plugins = {};
  global.data = {};
  global.interfaces = {};

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
  global.plugins.extMap = { map: {} };
  global.plugins.extNotify = new extNotify(global);
  global.plugins.extToolbar = new extToolbar(global);
  global.plugins.extConfig = new extConfig(global);
  global.plugins.extPopup = new extPopup(global);
  global.plugins.extMap = new extMap(global);

  global.initialize = function () {
    global.plugins.extScalebar = new extScalebar(global);
    global.plugins.extHome = new extHome(global);
    global.plugins.extSearch = new extSearch(global);
    global.plugins.extBasemap = new extBasemap(global);
    global.plugins.extLegend = new extLegend(global);
    global.plugins.extBookmarks = new extBookmarks(global);
    global.plugins.extLayerlist = new extLayerlist(global);

    window.setTimeout(() => {
      let layers = [{
        "overlayId": "SUBDIR01",
        "feature": "USER1001-01",
        "text": "User Layer - Test1",
        "layer": {
          "properties": {
            "url": "https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/wwa_meteocean_tropicalcyclones_trackintensityfcsts_time/MapServer/",
            "credentials": {
              "required": false,
              "token": ""
            }
          },
          "params": {
            "serviceType": "dynamic",
            "format": "image/png",
            "refreshInterval": "10",
            "zoom": "false",
            "showLabels": "false",
            "opacity": "0.50",
            "transparent": "true",
            "useProxy": "false"
          }
        }
      }];

      global.plugins.extLayerlist.addLayers(layers);
      /*
      let rivers = new FeatureLayer("https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Hydrography/Watershed173811/MapServer/1", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
      });
      let waterbodies = new FeatureLayer("https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Hydrography/Watershed173811/MapServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
      });

      global.plugins.extMap.map.addLayers([waterbodies, rivers]);
      */

      global.interfaces.messageService = new messageService(global);
    }, 1000);
  }
});