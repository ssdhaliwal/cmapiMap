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
  "esri/dijit/Scalebar",
  "esri/dijit/Measurement",
  "esri/dijit/Bookmarks",
  "esri/geometry/Extent",
  "dojo/parser",
  "dojo/dom-class",
  "dojo/dom-construct",
  "esri/units",
  "esri/geometry/projection",
  "notify/notify.min",
  "dojo/domReady!"
], function (
  Map,
  Popup,
  SimpleFillSymbol,
  Color,
  Scalebar,
  Measurement,
  Bookmarks,
  Extent,
  parser,
  ddomClass,
  domConstruct,
  Units,
  projection
) {
  var fill = new SimpleFillSymbol("solid", null, new Color("#A4CE67"));
  var popup = new Popup({
    fillSymbol: fill,
    titleInBody: false
  },
    domConstruct.create("div")
  );

  var map = new Map("map", {
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
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #legend_wrapper, , #draw_wrapper, #edit_wrapper, #bookmark_wrapper, #measure_wrapper, #quickIcon_wrapper"
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
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #legend_wrapper, , #basemaps_wrapper, #edit_wrapper, #bookmark_wrapper, #measure_wrapper, #quickIcon_wrapper"
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
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #legend_wrapper, , #basemaps_wrapper, #draw_wrapper, #edit_wrapper, #bookmark_wrapper, #quickIcon_wrapper"
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
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #legend_wrapper, , #basemaps_wrapper, #draw_wrapper, #edit_wrapper, #measure_wrapper, #quickIcon_wrapper"
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
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #legend_wrapper, , #basemaps_wrapper, #edit_wrapper, #bookmark_wrapper, #measure_wrapper, #draw_wrapper"
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
      "#overlay_wrapper, #about_wrapper, #batchselect_wrapper, #legend_wrapper, #basemaps_wrapper, #edit_wrapper, #bookmark_wrapper, #measure_wrapper, #draw_wrapper, #quickIcon_wrapper"
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
  measurement.startup();
  bookmarks.startup();

  // add projection load for global use
  const projectionPromise = projection.load();

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

  $("[rel=tooltip]").tooltip({
    placement: "bottom"
  });
  $("#measure").on("click", toggleMeasure);
  $("#bookmark").on("click", toggleBookmark);
  $("#controls").on("click", toggleSidenav);
  $("#control-slider").on("click", toggleControls);
  
  toggleControls();
});