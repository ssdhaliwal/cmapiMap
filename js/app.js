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

// Add imports for mySearch configuration and functions
require([
  "esri/map",
  "esri/dijit/Popup",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  "digits/overlayManager/js/overlayManager",
  "digits/about/js/about",
  "digits/batchSelect/js/batchSelect",
  "digits/legend/js/legend",
  "digits/quickIcon/js/quickicon",
  "esri/dijit/BasemapLayer",
  "esri/dijit/Basemap",
  "digits/basemapGallery/js/basemapGallery",
  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/dijit/Scalebar",
  "esri/dijit/Measurement",
  "esri/dijit/Bookmarks",
  "esri/geometry/Extent",
  "dojo/parser",
  "digits/featureMenu/js/featureMenu",
  "dojo/dom-class",
  "dojo/dom-construct",
  "esri/units",
  "esri/tasks/locator",
  "app/extensions/esriMySearch",
  "esri/geometry/projection",
  "app/JSUtils",
  "notify/notify.min",
  "dojo/domReady!"
], function (
  Map,
  Popup,
  SimpleFillSymbol,
  Color,
  OverlayManager,
  About,
  BatchSelect,
  Legend,
  QuickIcon,
  BasemapLayer,
  Basemap,
  BasemapGallery,
  ArcGISTiledMapServiceLayer,
  Scalebar,
  Measurement,
  Bookmarks,
  Extent,
  parser,
  featureMenu,
  domClass,
  domConstruct,
  Units,
  Locator,
  EsriMySearch,
  projection,
  JSUtils
) {
  var fill = new SimpleFillSymbol("solid", null, new Color("#A4CE67"));
  var popup = new Popup({
    fillSymbol: fill,
    titleInBody: false
  },
    domConstruct.create("div")
  );

  var map = new Map("map", {
    //  basemap: "streets",
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
    infoWindow: popup
  });
  map.infoWindow.resize(350, 240);

  // add to allow double-click without zoom
  map.disableDoubleClickZoom();

  map.on("extent-change", function (evt) {
    redrawGraphics();
  });

  map.on("resize", function (evt) {
    redrawGraphics();
  });

  map.on("load", function (evt) {
    redrawGraphics();
  });

  redrawGraphics = function () {
    graphics = map.graphicsLayerIds;
    for (i = 0; i < graphics.length; i++) {
      graphicLayer = map.getLayer(graphics[i]);
      graphicLayer.redraw();
    }
  };

  parser.parse();

  var featuremenu = new featureMenu({
    map: map,
    title: "Add Point Features to the Map",
    targetNodeIds: ["map"]
  }).initialize();

  var legend = new Legend(map);

  /** Create a esriMySearch object */
  var esriSearch = new EsriMySearch();

  /** Extend the search class with esriSearch's initSearch() */
  var MySearch = esriSearch.initSearch();
  var search = new MySearch({
    map: map,
    enableButtonMode: false,
    enableLabel: false,
    enableSearchingAll: false,
    enableInfoWindow: true,
    enableInfoWindowOnSelect: true,
    // addLayersFromMap: true,
    // enableSearchingAll: true,
    enableSourcesMenu: true,
    zoomScale: 100000
  },
    "search"
  );

  /** Subscribing the search object to the ActiveSourceIndex channel */
  /*
  OWF.Eventing.subscribe("com.esri.owf.map.activeSourceIndex", function (
    sender,
    msg
  ) {
    msg = parseInt(msg);
    if ((sender.id === OWF.getInstanceId()) || isNaN(msg)) {
      return;
    } else {
      search.set("activeSourceIndex", msg);
    }
  });
  */
  var sources = search.get("sources");

  sources.push({
    locator: new Locator(
      "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
    ),
    // highlightSymbol: {url: "https://js.arcgis.com/3.26/esri/dijit/Search/images/search-pointer.png", width: 36, height: 36, xoffset: 9, yoffset: 18},
    singleLineFieldName: "SingleLine",
    localSearchOptions: {
      minScale: 300000,
      distance: 50000
    },
    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
    name: "Lat/Long D.D",
    placeholder: "(+/-)DD.D(N/S), (+/-)DDD.D(E/W)",
    enableSuggestions: false
  });

  sources.push({
    locator: new Locator(
      "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
    ),
    singleLineFieldName: "SingleLine",
    localSearchOptions: {
      minScale: 300000,
      distance: 50000
    },
    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
    name: "Lat/Long D/M.m",
    placeholder: "(+/-)DD MM.M(N/S), (+/-)DDD MM.M(E/W)",
    enableSuggestions: false
  });

  sources.push({
    locator: new Locator(
      "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
    ),
    singleLineFieldName: "SingleLine",
    localSearchOptions: {
      minScale: 300000,
      distance: 50000
    },
    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
    name: "Lat/Long D/M/S.s",
    placeholder: "(+/-)DD MM SS.S(N/S), (+/-)DDD MM SS.S(E/W)",
    enableSuggestions: false
  });

  sources.push({
    locator: new Locator(
      "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=pjson&outFields=Addr_type&maxLocations=1&forStorage=false&SingleLine=18SUH6789043210"
    ),
    singleLineFieldName: "SingleLine",
    localSearchOptions: {
      minScale: 300000,
      distance: 50000
    },
    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
    name: "MGRS / USNG",
    placeholder: "NO SPACES",
    enableSuggestions: false
  });

  /** Set the sources above to the search widget */
  search.set("sources", sources);

  /** Implement a function to save the source preference of the user */
  search.savePreferences = function () {
  };

  /** Implement a function to retrieve the source preference of the user */
  search.retrievePreferences = function () {
  };

  /** Add extra functionality to the search-results method */
  search.on("search-results", function () {
    /**
     * Create a conditional when searching for an address within Source 0:
     *  if the returned search result is not null, color the search box white
     *  else, color the search box pink
     */
    if (search.get("activeSourceIndex") == 0) {
      if (search.get("searchResults") != null) {
        esriSearch.changeInputBoxColorOnSuccess();
      } else {
        esriSearch.changeInputBoxColorOnError();
        esriSearch.displayError();
      }
    }
  });

  /** Add extra functionality to the clear-search method */
  search.on("clear-search", function () {
    /**
     * Color the search box white when cleared
     * If the error box is showing
     *  then fade it out
     */
    esriSearch.changeInputBoxColorOnSuccess();
  });

  search.on("load", function () {
    $("#search_input").attr(
      "placeholder",
      "Find lat,lon / address / name."
    );

    /** Call the function to retrieve preferences */
    search.retrievePreferences();
  });

  /**
   * Call the function to save preferences and notify
   * other maps of the user's search selection.
   */
  $("div.searchMenu.sourcesMenu").on('click', function () {
    /*
    OWF.Eventing.publish(
      "com.esri.owf.map.activeSourceIndex",
      search.get("activeSourceIndex")
    );
      */
    /* save search option */
    if (search.get("activeSourceIndex") <= 5) {
      search.savePreferences();
    }

    closeKMLOverlappingWrapper();
  });

  var basemapGallery = new BasemapGallery({
    showArcGISBasemaps: true,
    /* 20191029 - depreciated due to no license key
    bingMapsKey: dojoConfig.siteKeys.BingMapsToken,
    */
    map: map
  },
    "basemapGallery"
  );

  // added usgs basemaps for backup
  basemapGallery.add(
    new Basemap({
      "layers": [new BasemapLayer({
        "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer"
      })],
      "title": "USGS Hydro Cached",
      "itemId": "USCG001",
      "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/info/thumbnail"
    }));
  basemapGallery.add(
    new Basemap({
      "layers": [new BasemapLayer({
        "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer"
      })],
      "title": "USGS Shaded Relief",
      "itemId": "USCG002",
      "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/info/thumbnail"
    }));
  basemapGallery.add(
    new Basemap({
      "layers": [new BasemapLayer({
        "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer"
      })],
      "title": "USGS ImageryOnly",
      "itemId": "USCG003",
      "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/info/thumbnail"
    }));
  basemapGallery.add(
    new Basemap({
      "layers": [new BasemapLayer({
        "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer"
      })],
      "title": "USGS Imagery Topo",
      "itemId": "USCG004",
      "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/info/thumbnail"
    }));
  basemapGallery.add(
    new Basemap({
      "layers": [new BasemapLayer({
        "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer"
      })],
      "title": "USGS Topo",
      "itemId": "USCG005",
      "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/info/thumbnail"
    }));
  basemapGallery.add(
    new Basemap({
      "layers": [new BasemapLayer({
        "url": "https://10.50.193.71:6443/arcgis/rest/services/InternalBaseMap/MapServer"
      })],
      "title": "USCG FailSafe",
      "itemId": "USCG006",
      "thumbnailUrl": "/GlobalRepo/Images/Basemaps/basemap.png"
    }));

  // added bing base maps
  /* 20191029 - depreciated due to no license key
  basemapGallery.add(
    new Basemap({
      "layers": [new BasemapLayer({ type: "BingMapsRoad" })],
      "title": "Bing Road",
      "itemId": "USCG006",
      "id": "bmRoad",
      "thumbnailUrl":"images/bing_streets.png"
    }));
    basemapGallery.add(
      new Basemap({
        "layers": [new BasemapLayer({ type: "BingMapsAerial" })],
        "title": "Bing Aerial",
        "itemId": "USCG007",
        "id": "bmAerial",
        "thumbnailUrl":"images/bing_aerial.png"
      }));
      basemapGallery.add(
        new Basemap({
          "layers": [new BasemapLayer({ type: "BingMapsHybrid" })],
          "title": "Bing Aerial with labels",
          "itemId": "USCG008",
          "id": "bmHybrid",
          "thumbnailUrl":"images/bing_aerial_hybrid.png"
        }));
  */
  // added site verification
  JSUtils.isSiteOnline("https://www.arcgis.com", function (found) {
    if (found) {
      map.setBasemap("streets");
    } else {
      window.alert("Temporary ArcGIS service outage; alternate basemap set to USGS Topo.\n\n** This impacts REFERENCE/WEATHER services from ArcGIS.com; NOAA and other sites are not impacted. **\n\nIf no basemaps are available due to network outage; please use one of the three alternate options: (a) USCG Failsafe basemap, (b) USGS basemaps, or (c) Catalog Widget World Countries KML (REFERENCE -> BOUNDARIES).\n\nSee Alert Feed Widget for more details.");
      var tBasemaps = basemapGallery.basemaps;
      $.each(tBasemaps, function (index, item) {
        if (item.title === "USGS Topo") {
          var currBasemap = map.getLayer('basemap');
          if (currBasemap) {
            map.removeLayer(currBasemap);
          }

          var newBasemap = new ArcGISTiledMapServiceLayer(item.layers[0].url, {
            "id": "basemap"
          });
          map.addLayer(newBasemap, 0);
        }
      });
    }
  });

  new Scalebar({
    map: map,
    attachTo: "bottom-left",
    scalebarUnit: "dual"
  });

  var measurement = new Measurement({
    map: map,
    defaultAreaUnit: Units.SQUARE_MILES,
    defaultLengthUnit: Units.MILES
  },
    "measurementDiv"
  );

  var bookmarks = new Bookmarks({
    map: map,
    bookmarks: [],
    editable: true
  },
    "bookmarkDiv"
  );

  var toggleBasemapGallery = function () {
    $(
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #draw_wrapper, #edit_wrapper, #bookmark_wrapper, #measure_wrapper, #quickIcon_wrapper"
    ).hide();
    $(
      "#overlay, #about, #batchselect, #legend, #draw, #bookmark, #measure, #edit, #quickIcon"
    ).removeClass("selected");

    $("#basemaps").toggleClass("selected");
    $("#basemaps_wrapper").toggle();

    closeKMLOverlappingWrapper();
  };

  var toggleDraw = function () {
    $(
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #basemaps_wrapper, #edit_wrapper, #bookmark_wrapper, #measure_wrapper, #quickIcon_wrapper"
    ).hide();
    $(
      "#basemaps, #overlay, #about, #batchselect, #legend, #bookmark, #measure, #edit, #quickIcon"
    ).removeClass("selected");

    $("#draw").toggleClass("selected");
    $("#draw_wrapper").toggle();

    closeKMLOverlappingWrapper();
  };

  var toggleMeasure = function () {
    $(
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #basemaps_wrapper, #draw_wrapper, #edit_wrapper, #bookmark_wrapper, #quickIcon_wrapper"
    ).hide();
    $(
      "#basemaps, #overlay, #about, #batchselect, #legend, #draw, #bookmark, #edit, #quickIcon"
    ).removeClass("selected");

    $("#measure").toggleClass("selected");
    $("#measure_wrapper").toggle();

    closeKMLOverlappingWrapper();
  };

  var toggleBookmark = function () {
    $(
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #basemaps_wrapper, #draw_wrapper, #edit_wrapper, #measure_wrapper, #quickIcon_wrapper"
    ).hide();
    $(
      "#basemaps, #overlay, #about, #batchselect, #legend, #draw, #measure, #edit, #quickIcon"
    ).removeClass("selected");

    $("#bookmark").toggleClass("selected");
    $("#bookmark_wrapper").toggle();

    closeKMLOverlappingWrapper();
  };

  var toggleQuickIcon = function () {
    $(
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #basemaps_wrapper, #edit_wrapper, #bookmark_wrapper, #measure_wrapper, #draw_wrapper"
    ).hide();
    $(
      "#basemaps, #overlay, #about, #batchselect, #legend, #bookmark, #measure, #edit, #draw"
    ).removeClass("selected");

    $("#quickIcon").toggleClass("selected");
    $("#quickIcon_wrapper").toggle();

    closeKMLOverlappingWrapper();
  };

  var toggleControls = function () {
    $(
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #basemaps_wrapper, #edit_wrapper, #bookmark_wrapper, #measure_wrapper, #draw_wrapper, #quickIcon_wrapper"
    ).hide();
    $(
      "#basemaps, #overlay, #about, #batchselect, #legend, #bookmark, #measure, #edit, #draw, #quickIcon"
    ).removeClass("selected");

    $("#map-controls1, #map-controls2").toggle();
    $("#control-slider").toggleClass("selected");

    closeKMLOverlappingWrapper();
  };

  var toggleSidenav = function () {
    if (document.getElementById("sidenav").style.width === "250px") {
      document.getElementById("sidenav").style.width = "0";
    } else {
      document.getElementById("sidenav").style.width = "250px";
    }
  };

  var homeClick = function () {
    overlayManager.adapter.view.handleCenterBounds(
      null,
      overlayManager.adapter.overlayManager.data.utilities.homeExtent
    );

    closeKMLOverlappingWrapper();
  };

  $('#kml_overlaps_close').on("click", function () {
    closeKMLOverlappingWrapper();
  });
  var closeKMLOverlappingWrapper = function () {
    // close the kml layer overlapping
    $('#kml_overlaps_wrapper').css("display", "none");
  };

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

  var errorNotifier = function (msg) {
    $.notify(msg, {
      className: "error",
      // autoHide: true,
      // autoHideDelay: 10000
      clickToHide: true
    });
  };

  var infoNotifier = function (msg) {
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

  // moved all startups here for preferences to work correctly
  featuremenu.startup();
  search.startup();
  basemapGallery.startup();
  measurement.startup();
  bookmarks.startup();

  // add projection load for global use
  const projectionPromise = projection.load();

  var overlayManager = new OverlayManager({
    map: map,
    basemapGallery: basemapGallery,
    measurement: measurement,
    bookmarks: bookmarks,
    search: search,
    projectionPromise: projectionPromise
  },
    errorNotifier,
    infoNotifier
  );
  map.OverlayManager = overlayManager;

  var about = new About({
    map: map,
    basemapGallery: basemapGallery
  },
    errorNotifier,
    infoNotifier
  );
  var batchselect = new BatchSelect({
    map: map,
    basemapGallery: basemapGallery
  },
    errorNotifier,
    infoNotifier
  );
  // var edit = new Edit({ map: map, basemapGallery: basemapGallery }, errorNotifier, infoNotifier);
  $("#map").on("mouseup", function () {
    $(
      "#about_wrapper, #batchselect_wrapper, #basemaps_wrapper"
    ).hide();
    $(
      "#basemaps, #about, #batchselect, #legend_button"
    ).removeClass("selected");
    // $('#data_div_button').removeClass('selected');
  });

  /**
   * Check and see if the sources menu is open,
   *  if so, check to see if an error display is open,
   *   if so, close that display to allow the user to see the sources
   */
  $("#search_menu_button").on(
    "click",
    esriSearch.changeInputBoxColorOnSuccess
  );

  $("#overlay").on("click", overlayManager.toggleOverlayManager);
  $("#about").on("click", about.toggleAbout);
  $("#batchselect").on("click", batchselect.toggleBatchSelect);
  // $('#edit').on('click', edit.toggleEdit);
  $("#basemaps").on("click", toggleBasemapGallery);
  $("#legend").on("click", legend.handleLegendPopOut);
  // $('#data_div_button').on('click', handleDataDivPopOut);
  $("[rel=tooltip]").tooltip({
    placement: "bottom"
  });
  $("#draw").on("click", toggleDraw);
  $("#measure").on("click", toggleMeasure);
  $("#bookmark").on("click", toggleBookmark);
  $("#controls").on("click", toggleSidenav);
  $("#home").on("click", homeClick);
  $("#quickIcon").on("click", toggleQuickIcon);

  $("#control-slider").on("click", toggleControls);
});