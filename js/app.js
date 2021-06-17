// Entry point for map webapp

// NOTE: Modules that are not compatible with asynchronous module loading
// (AMD) are included in the webapp's HTML file to prevent issues.

require([
  "dojo/parser", 
  "esri/geometry/projection",
  "plugins/notify/Notify", "plugins/toolbar/Toolbar", "plugins/config/Config", "plugins/popup/Popup", "plugins/map/Map", "plugins/scalebar/Scalebar",
  "plugins/home/Home", "plugins/search/Search", "plugins/basemap/Basemap", "plugins/legend/Legend", "plugins/bookmarks/Bookmarks",
  "plugins/datagrid/Datagrid", "plugins/layerlist/Layerlist",
  "interface/geocodingService", "interface/geometryService", "interface/geoprocessingService", "interface/messageService",
  "dojo/domReady!"
], function (
  parser,
  projection,
  extNotify, extToolbar, extConfig, extPopup, extMap, extScalebar,
  extHome, extSearch, extBasemap, extLegend, extBookmarks,
  extDatagrid, extLayerlist,
  geocodingService, geometryService, geoprocessingService, messageService
) {
  globals.plugins = {};
  globals.data = {};
  globals.interfaces = {};

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

  // console.log("app - startup");
  $("[rel=tooltip]").tooltip({
    placement: "bottom"
  });
  globals.plugins.extMap = { };
  globals.interfaces.messageService = new messageService(globals);
  globals.interfaces.geocodingService = new geocodingService(globals);
  globals.interfaces.geometryService = new geometryService(globals);
  globals.interfaces.geoprocessingService = new geoprocessingService(globals);

  globals.plugins.extNotify = new extNotify(globals);
  globals.plugins.extToolbar = new extToolbar(globals);
  globals.plugins.extConfig = new extConfig(globals);
  globals.plugins.extPopup = new extPopup(globals);
  globals.plugins.extMap = new extMap(globals);

  globals.initialize = function () {
    // console.log("app - initialize");
    if (globals.options.map.scalebar) {
      globals.plugins.extScalebar = new extScalebar(globals);
    }

    globals.plugins.extHome = new extHome(globals);

    if (globals.options.search.available) {
      globals.plugins.extSearch = new extSearch(globals);
    }
    
    globals.plugins.extBasemap = new extBasemap(globals);
    globals.plugins.extLegend = new extLegend(globals);
    globals.plugins.extBookmarks = new extBookmarks(globals);
    globals.plugins.extDatagrid = new extDatagrid(globals);

    window.setTimeout(() => {
      globals.plugins.extLayerlist = new extLayerlist(globals);

      // update the ui based on config opions
      if (globals.options.basemap.available) {
        globals.plugins.extBasemap.show();
      }
      if (globals.options.bookmarks.available) {
        globals.plugins.extBookmarks.show();
      }
      if (!globals.options.bookmarks.available) {
        globals.plugins.extBookmarks.hide();
      }
      if (globals.options.config.available) {
        globals.plugins.extConfig.show();
      }
      if (!globals.options.config.available) {
        globals.plugins.extConfig.hide();
      }
      if (globals.options.datagrid.available) {
        globals.plugins.extDatagrid.show();
      }
      if (globals.options.home.available) {
        globals.plugins.extHome.show();
      }
      if (globals.options.layerlist.available) {
        globals.plugins.extLayerlist.show();
      }
      if (globals.options.map.infobar) {
        $("#latlonpos").css("display", "block");
      }
      if (globals.options.map.zoombar) {
        $(".esriSimpleSliderIncrementButton").css("display", "block");
        $(".esriSimpleSliderDecrementButton").css("display", "block");
      }
      if (globals.options.legend.available) {
        globals.plugins.extLegend.show();
      }
      if (!globals.options.legend.available) {
        globals.plugins.extLegend.hide();
      }
      if (globals.options.toolbar.available) {
        globals.plugins.extToolbar.show();
      }
    }, 1000);
  }
});