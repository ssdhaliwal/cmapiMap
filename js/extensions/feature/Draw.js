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
define([
  "dojo/_base/lang",
  "dojo/store/Memory",
  "dijit/form/Button",
  "dijit/form/ComboBox",
  "dijit/ColorPalette",
  "dijit/registry",
  "esri/dijit/ColorPicker",
  "esri/toolbars/draw",
  "esri/toolbars/edit",
  "esri/graphic",
  "esri/InfoTemplate",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  "esri/layers/GraphicsLayer",
  "esri/dijit/editing/Editor",
  "dijit/TooltipDialog",
  "dijit/popup",
  "dojo/dom-style",
  "esri/graphicsUtils"
], function (
  lang,
  Memory,
  Button,
  ComboBox,
  ColorPalette,
  registry,
  ColorPicker,
  DrawToolbar,
  Edit,
  Graphic,
  InfoTemplate,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  SimpleFillSymbol,
  Color,
  GraphicsLayer,
  Editor,
  TooltipDialog,
  dijitPopup,
  domStyle,
  graphicsUtils
) {
  /**
   * Draw tools that will be placed on the map.
   * @constructor
   * @param map {object} ESRI map object for which this Overlay Manager should apply
   * @param errorNotifier {module:cmwapi-adapter/errorNotifier}
   * @param notifier {module:cmwapi-adapter/notifier}
   * @alias module:digits/OverlayManager
   */

  (function ($) {
    $.each(["show", "hide"], function (i, ev) {
      var el = $.fn[ev];
      $.fn[ev] = function () {
        this.trigger(ev);
        return el.apply(this, arguments);
      };
    });
  })(jQuery);

  var Draw = function (data) {
    //The draw html is populated from a template @ /feature/DrawTool/draw.html
    $("#draw_wrapper").load("./digits/draw/index.html", function () {
      $("#pointDiamondButton").on("click", pointDiamondButtonClicked);
      $("#pointCircleButton").on("click", pointCircleButtonClicked);
      $("#pointCrossButton").on("click", pointCrossButtonClicked);
      $("#pointSquareButton").on("click", pointSquareButtonClicked);
      $("#pointXButton").on("click", pointXButtonClicked);

      $("#polygonButton").on("click", polygonButtonClicked);
      $("#lineButton").on("click", lineButtonClicked);
      $("#polylineButton").on("click", polylineButtonClicked);
      $("#freePolygonButton").on("click", freePolygonButtonClicked);
      $("#freePolylineButton").on("click", freePolylineButtonClicked);
      $("#triangleButton").on("click", triangleButtonClicked);
      $("#circleButton").on("click", circleButtonClicked);
      $("#ellipseButton").on("click", ellipseButtonClicked);
      $("#clearGraphicsButton").on("click", clearGraphicsClicked);
      $("#doneDrawButton").on("click", doneDrawClicked);
      $("#cancelDrawButton").on("click", cancelDrawClicked);
      $("#zoomButton").on("click", zoomClicked);

      $("#borderPalleteToggle").on("click", palleteToggleClicked);
      $("#fillPalleteToggle").on("click", palleteToggleClicked);

      $("#draw_wrapper").on("hide", hideDraw);

      //Disable the control buttons until a valid layer is selected.
      document.getElementById("doneDrawButton").disabled = true;
      document.getElementById("cancelDrawButton").disabled = true;
      document.getElementById("zoomButton").disabled = true;
      document.getElementById("clearGraphicsButton").disabled = true;

      map = data.map;
      overlayManager = data.overlayManager;
      drawToolbar = new DrawToolbar(map);
      drawToolbar.on("draw-end", addToMap);
      drawToolActive = false;
      editToolbarActive = false;

      coordinates = [];
      features = [];
      featureTypes = [];

      borderColorPicker = new ColorPicker(
        {
          showRecentColors: false,
          colorsPerRow: 16,
          required: true
        },
        borderPalette
      );
      fillColorPicker = new ColorPicker(
        {
          showRecentColors: false,
          colorsPerRow: 16,
          required: true
        },
        fillPalette
      );
      lineColorPicker = new ColorPicker(
        {
          showRecentColors: false,
          colorsPerRow: 16,
          required: true
        },
        linePalette
      );
      markerColorPicker = new ColorPicker(
        {
          showRecentColors: false,
          colorsPerRow: 16,
          required: true
        },
        markerPalette
      );
      this.pointStyle = "path";

      //Add events to change colors on edit.
      fillColorPicker.on("color-change", fillColorChanged);
      borderColorPicker.on("color-change", borderColorChanged);
      lineColorPicker.on("color-change", lineColorChanged);
      markerColorPicker.on("color-change", markerColorChanged);

      graphicsStore = new Memory({
        data: [
          {
            name: "-Enter Graphics Layer Name-",
            id: "-Enter Graphics Layer Name-"
          }
        ]
      });
      this.graphicSelectCombo = new ComboBox(
        {
          id: "graphicSelect",
          name: "Graphics Layers",
          value: "-Enter Graphics Layer Name-",
          store: graphicsStore
        },
        "graphicSelect"
      ).startup();

      $("#graphicSelect").on("blur", layerSelectChanged);
      $("#graphicSelect").on("change", layerSelectChanged);
      $("#graphicSelect").on("input", layerSelectInput);

      $("#graphicSelect").on("mouseover", function (evt) {
        if (layerId !== "-Enter Graphics Layer Name-") {
          document.getElementById("tooltipData").style.display = "block";
        }
      });
      $("#graphicSelect").on("mouseout", function (evt) {
        document.getElementById("tooltipData").style.display = "none";
      });

      diamondOn = 0;
      pointOn = 0;
      crossOn = 0;
      squareOn = 0;
      xOn = 0;
      lineOn = 0;
      polygonOn = 0;
      lineOn = 0;
      polylineOn = 0;
      freePolygonOn = 0;
      freePolylineOn = 0;
      triangleOn = 0;
      circleOn = 0;
      ellipseOn = 0;

      editToolbar = new Edit(map);

      map.on("dbl-click", function (evt) {
        if ($(draw_wrapper).is(":hidden")) {
        } else {
          if (!drawToolActive) {
            if (evt.graphic) {
              var selected = $(graphicSelect).val();
              layer = map.getLayer(selected);
              var contains = false;
              if (layer) {
                contains = layer.graphics.includes(evt.graphic);
              }
              if (contains) {
                activateToolbar(evt.graphic);
                map.infoWindow.hide();
                dijitPopup.close(dialog);
              } else {
                layer = map.graphics;
                contains = layer.graphics.includes(evt.graphic);
                if (contains) {
                  activateToolbar(evt.graphic);
                  map.infoWindow.hide();
                  dijitPopup.close(dialog);
                } else {
                  editToolbar.deactivate();
                  editToolbarActive = false;
                  map.graphics.redraw();
                }
              }
            } else {
              editToolbar.deactivate();
              editToolbarActive = false;
              map.graphics.redraw();
            }
          }
        }
      });

      map.on("click", function (evt) {
        if (evt.graphic) {
          // map.infoWindow.hide();
          var selected = $(graphicSelect).val();
          layer = map.getLayer(selected);
          var contains = false;
          if (layer) {
            contains = layer.graphics.includes(evt.graphic);
          }
          if (!$(draw_wrapper).is(":hidden") &&
            (((selected === "-Enter Graphics Layer Name-") && !isUserGraphic(evt.graphic)) ||
              (contains) ||
              (!contains && !isUserGraphic(evt.graphic)))) {
            //Set the edit info template
            var infoTemplate = evt.graphic.getInfoTemplate();
            if (infoTemplate) {
              infoTemplate.setTitle(selected)
              //infoTemplate.setContent("Name: <input id='nameBox' name='nameBox' type='text' size=18 value=" + evt.graphic.attributes.Name + "><br/>Comment: <textarea id='commentArea' name='nameArea'style='width: 190px; height: 75px;' rows='4'>" + evt.graphic.attributes.Comment + "</textarea><br/>Date Entered: " + evt.graphic.attributes.DateEntered + "<br/><button id='SaveButton' onclick='saveGraphicAttributes(nameBox.value, commentArea.value);'>Save</button><button id='DeleteButton' onclick='deleteGraphic();'>Delete</button>");
              infoTemplate.setContent("<table style='width:100%;'><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Name: </b></td><td style='width:85%;'><input id='nameBox' name='nameBox' type='text' size=30 width='90%' value='" + evt.graphic.attributes.Name + "'></td></tr><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Comment: </b></td><td style='width:85%;'><textarea id='commentArea' name='nameArea' style='height:100px;width:90%;' rows='4'>" + evt.graphic.attributes.Comment + "</textarea></td></tr><tr><td colspan='2'><b>Updated: </b>" + evt.graphic.attributes.DateEntered + "</td></tr><tr><td colspan='2'><table width='100%'><tr><td style='width:50%;text-align:center;'><button id='SaveButton' onclick='saveGraphicAttributes(nameBox.value, commentArea.value);'>Save</button></td><td style='width:50%;text-align:center;'><button id='DeleteButton' onclick='deleteGraphic();'>Delete</button></td></td></table></td></tr></table>");
              evt.graphic.setInfoTemplate(infoTemplate);
              map.infoWindow.setContent(infoTemplate.content);
              map.infoWindow.setTitle(infoTemplate.title);
              map.infoWindow.show();
            }
          }
          //If it is contained in another of our graphics layers then we update the info template
          else if (isUserGraphic(evt.graphic)) {
            var infoTemplate = evt.graphic.getInfoTemplate();
            if (infoTemplate) {
              //infoTemplate.setContent("Name: " + evt.graphic.attributes.Name + "<br/>Comment: " + evt.graphic.attributes.Comment + "<br/>Date Entered: " + evt.graphic.attributes.DateEntered + "<br/>");
              infoTemplate.setContent("<table style='width:100%;'><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Name: </b></td><td style='width:85%;'>" + evt.graphic.attributes.Name + "</td></tr><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Comment: </b></td><td style='width:85%;white-space:pre;'>" + evt.graphic.attributes.Comment + "</td></tr><tr><td colspan='2'><b>Updated: </b>" + evt.graphic.attributes.DateEntered + "</td></tr></table>");
              evt.graphic.setInfoTemplate(infoTemplate);
              map.infoWindow.setContent(infoTemplate.content);
              map.infoWindow.setTitle(infoTemplate.title);
              map.infoWindow.show();
            }
          }
        }

        editToolbar.deactivate();
        editToolbarActive = false;
        if (map.graphics) {
          map.graphics.redraw();
        }
      });

      editToolbar.on("graphic-first-move", function (evt) {
        map.infoWindow.hide();
      });
      editToolbar.on("rotate-first-move", function (evt) {
        map.infoWindow.hide();
      });
      editToolbar.on("scale-first-move", function (evt) {
        map.infoWindow.hide();
      });
      editToolbar.on("vertex-first-move", function (evt) {
        map.infoWindow.hide();
      });

      editToolbar.on("graphic-move-stop", function (evt) {
        //Graphics are not redrawing inside of OWF so we are forcing the redraw.
        redrawGraphics();
      });
      editToolbar.on("rotate-stop", function (evt) {
        //Graphics are not redrawing inside of OWF so we are forcing the redraw.
        redrawGraphics();
      });
      editToolbar.on("scale-stop", function (evt) {
        //Graphics are not redrawing inside of OWF so we are forcing the redraw.
        redrawGraphics();
      });
      editToolbar.on("vertex-move-stop", function (evt) {
        //Graphics are not redrawing inside of OWF so we are forcing the redraw.
        redrawGraphics();
      });

      $("#draw_wrapper").on("show", drawOpened);

      dialog = new TooltipDialog({
        id: "tooltipDialog",
        style:
          "position: absolute; width: 100px; font: normal normal normal 10pt Helvetica;z-index:100;"
      });
      dialog.startup();
    });

    var isUserGraphic = function (graphic) {
      contains = false;
      layerIds = map.graphicsLayerIds;
      i = 0;

      while (i < layerIds.length) {
        if (graphicsStore.data[i]) {
          layer = map.getLayer(graphicsStore.data[i].id);
          if (layer) {
            contains = layer.graphics.includes(graphic);
            if (contains) {
              return contains;
            }
          }
        }

        i++;
      }
      return contains;
    };

    var layerSelectInput = function () {
      layerId = graphicSelect.value;
      if (graphicsStore.get("-Enter Graphics Layer Name-")) {
        graphicsStore.remove("-Enter Graphics Layer Name-");
      }
      //If no layer name is entered then disable teh buttons.
      if (layerId == "") {
        //Valid layer not selected, disable buttons.
        document.getElementById("doneDrawButton").disabled = true;
        document.getElementById("cancelDrawButton").disabled = true;
        document.getElementById("zoomButton").disabled = true;
        document.getElementById("clearGraphicsButton").disabled = true;
      }
    };

    var layerSelectChanged = function () {
      layerId = graphicSelect.value;
      layer = map.getLayer(layerId);
      if (layer && !layer.visible) {
        overlayManager.sendFeatureShow("User Defined", layerId, false);
      }
      //Ensure the default text has been removed.
      //graphicsStore.remove("-Enter/Select Graphics Layer Name-");
      if (layerId !== "-Enter Graphics Layer Name-" && layerId !== "") {
        //Valid layer selected so enable buttons.
        document.getElementById("doneDrawButton").disabled = false;
        document.getElementById("cancelDrawButton").disabled = false;
        document.getElementById("zoomButton").disabled = false;
        document.getElementById("clearGraphicsButton").disabled = false;
      } else {
        //Valid layer not selected, disable buttons.
        document.getElementById("doneDrawButton").disabled = true;
        document.getElementById("cancelDrawButton").disabled = true;
        document.getElementById("zoomButton").disabled = true;
        document.getElementById("clearGraphicsButton").disabled = true;
      }
    };

    var fillColorChanged = function (evt) {
      if (editToolbarActive) {
        var currentEdit = editToolbar.getCurrentState();
        color = new Color(evt.color);
        currentEdit.graphic.symbol.color = color;
        redrawGraphics();
      }
    };

    var borderColorChanged = function (evt) {
      if (editToolbarActive) {
        var currentEdit = editToolbar.getCurrentState();
        color = new Color(evt.color);
        currentEdit.graphic.symbol.outline.color = color;
        redrawGraphics();
      }
    };

    var lineColorChanged = function (evt) {
      if (editToolbarActive) {
        var currentEdit = editToolbar.getCurrentState();
        color = new Color(evt.color);
        currentEdit.graphic.symbol.color = color;
        redrawGraphics();
      }
    };

    var markerColorChanged = function (evt) {
      if (editToolbarActive) {
        var currentEdit = editToolbar.getCurrentState();
        color = new Color(evt.color);
        currentEdit.graphic.symbol.color = color;
        redrawGraphics();
      }
    };

    var redrawGraphics = function () {
      map.graphics.redraw();
      var layers = map.graphicsLayerIds;
      var i = 0;
      while (i < layers.length) {
        map.getLayer(layers[i]).redraw();
        i++;
      }
    };

    var hideDraw = function () {
      clearTools();
      drawToolbar.deactivate();
      drawToolActive = false;
      editToolbar.deactivate();
      editToolbarActive = false;
    };

    var drawOpened = function () {
      layerId = graphicSelect.value;
      layer = map.getLayer(layerId);
      if (layer && !layer.visible) {
        overlayManager.sendFeatureShow("User Defined", layerId, false);
      }
    };

    var showDraw = function () {
      try {
        graphicsStore.add({
          name: featureName,
          id: featureId
        });
      } catch (err) {
        console.log("Graphic layer already exists in graphic select drop down.", err);
      }
      //Ensure the default text has been removed.
      graphicsStore.remove("-Enter Graphics Layer Name-");
      graphicSelectCombo.setValue(featureName);
    };

    var activateToolbar = function (graphic) {
      var tool = 0;
      tool = tool | Edit.MOVE;
      tool = tool | Edit.EDIT_VERTICES;
      tool = tool | Edit.SCALE;
      tool = tool | Edit.ROTATE;
      tool = tool | Edit.EDIT_TEXT;
      if (!drawToolActive) {
        editToolbar.activate(tool, graphic);
        editToolbarActive = true;
      }
      json = graphic.toJson();
      symbolType = json.symbol.type;
      //Polygon Symbols
      if (symbolType == "esriSFS") {
        document.getElementById("borderPaletteRow").style.display = "block";
        document.getElementById("linePaletteRow").style.display = "none";
        document.getElementById("markerPaletteRow").style.display = "none";
      }
      //Point Symbols
      if (symbolType == "esriSMS") {
        document.getElementById("borderPaletteRow").style.display = "block";
        document.getElementById("linePaletteRow").style.display = "none";
        document.getElementById("markerPaletteRow").style.display = "none";
      }
      //Line Symbols
      if (symbolType == "esriSLS") {
        document.getElementById("borderPaletteRow").style.display = "none";
        document.getElementById("linePaletteRow").style.display = "block";
        document.getElementById("markerPaletteRow").style.display = "none";
      }
    };

    var clearGraphicsClicked = function () {
      map.graphics.clear();
      document.getElementById("unsavedChangesRow").style.display = "none";
      dijit.byId("graphicSelect").attr("disabled", false);
    };

    var doneDrawClicked = function () {
      map.infoWindow.hide();
      //Turn off all draw tools
      drawToolbar.deactivate();
      drawToolActive = false;
      editToolbar.deactivate();
      editToolbarActive = false;
      clearTools();
      document.getElementById("unsavedChangesRow").style.display = "none";
      dijit.byId("graphicSelect").attr("disabled", false);
      //Create a new graphics layer to add to the map and the overlay manager.
      //featureId = $('#featureId').val();
      featureId = graphicSelect.value;

      overlayId = $("#overlayId").val();

      if (!featureId || featureId == " ") {
        featureId = "User Graphics";
      }

      //Make sure the featureId isn't already a name in the graphicSelect combo box'
      var results = graphicsStore.query({
        name: featureId
      });
      if (results.total > 0) {
        featureName = results[0].name;
        featureId = results[0].id;
      } else {
        featureName = featureId;
      }

      if (!overlayId || overlayId == " ") {
        overlayId = "User Defined";
      }
      overlayManager.createDrawOverlay(overlayId, overlayId);

      var existingLayer = map.getLayer(featureId);
      var userGraphic = null;
      if (existingLayer) {
        userGraphic = existingLayer;
      } else {
        var infoTemplate = new InfoTemplate();
        infoTemplate.setTitle("<b>User Defined Graphic</b>");
        infoTemplate.setContent(
          "<table style='width:100%;'><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Name: </b></td><td style='width:85%;'><input id='nameBox' name='nameBox' type='text' size=30 width='90%' value='${Name}'></td></tr><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Comment: </b></td><td style='width:85%;'><textarea id='commentArea' name='nameArea'style='height:100px;width:90%;' rows='4'>${Comment}</textarea></td></tr><tr><td colspan='2'><b>Updated: </b>${DateEntered}</td></tr><tr><td colspan='2'><table width='100%'><tr><td style='width:50%;text-align:center;'><button id='SaveButton' onclick='saveGraphicAttributes(nameBox.value, commentArea.value);'>Save</button></td><td style='width:50%;text-align:center;'><button id='DeleteButton' onclick='deleteGraphic();'>Delete</button></td></td></table></td></tr></table>"
        );
        userGraphic = new GraphicsLayer({
          id: featureId,
          dataAttributes: ["Name", "Comment", "DateCreated", "LatLon"],
          infoTemplate: infoTemplate
        });
      }
      // ssd - bug duplication of editing graphics
      i = 0;
      k = userGraphic.graphics.length;
      while (i < map.graphics.graphics.length) {
        if (
          map.graphics.graphics[i].hasOwnProperty("visible") &&
          map.graphics.graphics[i].visible === false
        ) {
        } else {
          userGraphic.graphics[k] = map.graphics.graphics[i];
          k++;
        }
        i++;
      }
      map.graphics.clear();
      if (existingLayer) {
        userGraphic.redraw();
        userGraphic.setVisibility(true);
      } else {
        map.addLayer(userGraphic);
        try {
          graphicsStore.add({
            name: featureName,
            id: featureId
          });
        } catch (err) {
          console.log("Graphic layer already exists in graphic select drop down.", err);
        }
        //Ensure the default text has been removed.
        graphicsStore.remove("-Enter Graphics Layer Name-");
        map.infoWindow.on("show", function (evt) {
          dijitPopup.close(dialog);
        });

        userGraphic.on("mouse-over", function (evt) {
          if (
            !map.infoWindow.isShowing &&
            evt.graphic &&
            evt.graphic.attributes &&
            evt.graphic.attributes.Name &&
            evt.graphic.attributes.Name !== " "
          ) {
            var content = evt.graphic.attributes.Name;
            dialog.setContent(content);
            domStyle.set(dialog.domNode, "opacity", 0.85);
            dijitPopup.open({
              popup: dialog,
              x: evt.pageX,
              y: evt.pageY
            });
          }
        });
        userGraphic.on("mouse-out", function (evt) {
          dijitPopup.close(dialog);
        });
      }
      $("#draw").removeClass("selected");
      $("#draw_wrapper").hide();
      //Add layer to overlay Manager
      overlayManager.feature.addDrawFeature(
        overlayId,
        featureId,
        featureName,
        userGraphic
      );

      var graphicsLayer = map.getLayer(featureId);
      var currentGraphics = graphicsLayer.graphics;

      var j = 0;
      var tempGeometry = null;
      while (j < currentGraphics.length) {
        if (currentGraphics[j].symbol) {
          tempGeometry = currentGraphics[j].toJson();
          //tempGeometry.geometry = JSON.parse(JSON.stringify(currentGraphics[j].geometry));
          //tempGeometry.symbol = JSON.parse(JSON.stringify(currentGraphics[j].symbol))
          //delete tempGeometry.geometry.cache;
          features.push(tempGeometry);
          featureTypes.push(currentGraphics[j].geometry.type);
        }
        j++;
      }

      var data = {};
      data.overlayId = overlayId;
      data.featureId = featureId;
      data.name = featureName;
      data.types = featureTypes;
      data.feature = {};
      data.feature.features = [];
      data.feature.type = "FeatureCollection";
      data.feature.features = JSON.stringify(features);
      data.feature.features = JSON.parse(data.feature.features);
      data.format = "json";
      coordinates = {};
      coordinates.type = map.extent.type;
      coordinates.spatialReference = map.extent.spatialReference;
      coordinates.xmax = map.extent.xmax;
      coordinates.ymax = map.extent.ymax;
      coordinates.xmin = map.extent.xmin;
      coordinates.ymin = map.extent.ymin;
      data.coordinates = coordinates;
      sendComplete(data);
    };

    var cancelDrawClicked = function () {
      document.getElementById("unsavedChangesRow").style.display = "none";
      dijit.byId("graphicSelect").attr("disabled", false);

      drawToolbar.deactivate();
      drawToolActive = false;
      clearTools();
      map.graphics.clear();
      $("#draw").removeClass("selected");
      $("#draw_wrapper").hide();
      sendCancel();
    };

    var zoomClicked = function () {
      var featureId = graphicSelect.value;
      var zoomLayer = map.getLayer(featureId);
      if (zoomLayer) {
        if (zoomLayer.graphics && zoomLayer.graphics.length > 0) {
          newExtent = zoomLayer.graphics[1]._extent;
          for (k = 1; k < zoomLayer.graphics.length; k++) {
            newExtent = newExtent.union(zoomLayer.graphics[k]._extent);
          }
          /*
						graphicsList = zoomLayer.graphics;
						graphicsList.shift();
						newExtent = graphicsUtils.graphicsExtent(graphicsList);	
						*/
        }
        newExtent = newExtent.expand(2);
        map.setExtent(newExtent, true);
      }
    };

    var sendProgress = function (payload) {
      payload.overlayId = $("#overlayId").val();
      payload.featureId = $("#featureId").val();
      if (!payload.overlayId || payload.overlayId === " ") {
        payload.overlayId = "User Defined";
      }
      if (!payload.featureId || payload.featureId === " ") {
        payload.featureId = "User Graphics";
      }
      /*        
      cmwapi.message.progress.send(payload);
      */
    };

    var sendComplete = function (payload) {
      /*        
      cmwapi.message.complete.send(payload);
      */
      featureTypes = [];
      features = [];
    };

    var sendCancel = function () {
      var payload = {};
      payload.messageId =
        $("#overlayId").val() + "-" + $("#featureId").val() + "-Cancel";
      /*        
      cmwapi.message.cancel.send(payload);
      */
      featureTypes = [];
      features = [];
    };
    var pointDiamondButtonClicked = function () {
      setPointStyle("diamond");
      toggleOffButtons();

      if (diamondOn) {
        $("#pointDiamondButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        diamondOn = 0;
      } else {
        diamondOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        $("#pointDiamondButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.POINT);
        drawToolActive = true;
        var data = {};
        data.type = "point";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "none";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "block";
    };

    var pointCircleButtonClicked = function () {
      setPointStyle("circle");
      toggleOffButtons();
      if (pointOn) {
        $("#pointCircleButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        pointOn = 0;
      } else {
        pointOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        $("#pointCircleButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.POINT);
        drawToolActive = true;
        var data = {};
        data.type = "point";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "none";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "block";
    };

    var pointCrossButtonClicked = function () {
      if (crossOn) {
        $("#pointCrossButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        crossOn = 0;
      } else {
        crossOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        setPointStyle("cross");
        toggleOffButtons();
        $("#pointCrossButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.POINT);
        drawToolActive = true;
        var data = {};
        data.type = "point";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "none";
      //document.getElementById("fillPaletteRow").style.display = "none";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "block";
    };

    var pointSquareButtonClicked = function () {
      if (squareOn) {
        $("#pointSquareButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        squareOn = 0;
      } else {
        squareOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        setPointStyle("square");
        toggleOffButtons();
        $("#pointSquareButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.POINT);
        drawToolActive = true;
        var data = {};
        data.type = "point";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "none";
      //document.getElementById("fillPaletteRow").style.display = "none";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "block";
    };

    var pointXButtonClicked = function () {
      if (xOn) {
        $("#pointXButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        xOn = 0;
      } else {
        xOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        setPointStyle("x");
        toggleOffButtons();
        $("#pointXButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.POINT);
        drawToolActive = true;
        var data = {};
        data.type = "point";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "none";
      //document.getElementById("fillPaletteRow").style.display = "none";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "block";
    };

    var polygonButtonClicked = function () {
      if (polygonOn) {
        $("#polygonButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        polygonOn = 0;
      } else {
        polygonOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        toggleOffButtons();
        $("#polygonButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.POLYGON);
        drawToolActive = true;
        var data = {};
        data.type = "polygon";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "block";
      //document.getElementById("fillPaletteRow").style.display = "block";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "none";
    };

    var lineButtonClicked = function () {
      if (lineOn) {
        $("#lineButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        lineOn = 0;
      } else {
        lineOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        toggleOffButtons();
        $("#lineButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.LINE);
        drawToolActive = true;
        var data = {};
        data.type = "line";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "none";
      //document.getElementById("fillPaletteRow").style.display = "none";
      document.getElementById("linePaletteRow").style.display = "block";
      document.getElementById("markerPaletteRow").style.display = "none";
    };

    var polylineButtonClicked = function () {
      if (polylineOn) {
        $("#polylineButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        polylineOn = 0;
      } else {
        polylineOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        toggleOffButtons();
        $("#polylineButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.POLYLINE);
        drawToolActive = true;
        var data = {};
        data.type = "line";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "none";
      //document.getElementById("fillPaletteRow").style.display = "none";
      document.getElementById("linePaletteRow").style.display = "block";
      document.getElementById("markerPaletteRow").style.display = "none";
    };

    var freePolygonButtonClicked = function () {
      if (freePolygonOn) {
        $("#freePolygonButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        freePolygonOn = 0;
      } else {
        freePolygonOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        toggleOffButtons();
        $("#freePolygonButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.FREEHAND_POLYGON);
        drawToolActive = true;
        var data = {};
        data.type = "polygon";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "block";
      //document.getElementById("fillPaletteRow").style.display = "block";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "none";
    };

    var freePolylineButtonClicked = function () {
      if (freePolylineOn) {
        $("#freePolylineButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        freePolylineOn = 0;
      } else {
        freePolylineOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        toggleOffButtons();
        $("#freePolylineButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.FREEHAND_POLYLINE);
        drawToolActive = true;
        var data = {};
        data.type = "line";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "none";
      //document.getElementById("fillPaletteRow").style.display = "none";
      document.getElementById("linePaletteRow").style.display = "block";
      document.getElementById("markerPaletteRow").style.display = "none";
    };

    var triangleButtonClicked = function () {
      if (triangleOn) {
        $("#triangleButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        triangleOn = 0;
      } else {
        triangleOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        toggleOffButtons();
        $("#triangleButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.TRIANGLE);
        drawToolActive = true;
        var data = {};
        data.type = "polygon";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "block";
      //document.getElementById("fillPaletteRow").style.display = "block";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "none";
    };

    var circleButtonClicked = function () {
      if (circleOn) {
        $("#circleButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        circleOn = 0;
      } else {
        circleOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        toggleOffButtons();
        $("#circleButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.CIRCLE);
        drawToolActive = true;
        var data = {};
        data.type = "polygon";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "block";
      //document.getElementById("fillPaletteRow").style.display = "block";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "none";
    };

    var ellipseButtonClicked = function () {
      if (ellipseOn) {
        $("#ellipseButton").removeClass("icon-selected");
        drawToolbar.deactivate();
        drawToolActive = false;
        ellipseOn = 0;
      } else {
        ellipseOn = 1;
        editToolbar.deactivate();
        editToolbarActive = false;
        map.infoWindow.hide();
        toggleOffButtons();
        $("#ellipseButton").addClass("icon-selected");
        drawToolbar.activate(DrawToolbar.ELLIPSE);
        drawToolActive = true;
        var data = {};
        data.type = "polygon";
        data.feature = {};
        data.format = "geojson";
        data.updates = {};
        sendProgress(data);
      }
      document.getElementById("borderPaletteRow").style.display = "block";
      //document.getElementById("fillPaletteRow").style.display = "block";
      document.getElementById("linePaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "none";
    };

    var palleteToggleClicked = function (event) {
      if (event.target.id === "borderPalleteToggle") {
        $("#fillPalleteToggle").removeClass("drawHighlight");
        $("#borderPalleteToggle").addClass("drawHighlight");

        document.getElementById("fillPalleteWrapper").style.display = "none";
        document.getElementById("borderPalleteWrapper").style.display = "block";
      } else if (event.target.id === "fillPalleteToggle") {
        $("#borderPalleteToggle").removeClass("drawHighlight");
        $("#fillPalleteToggle").addClass("drawHighlight");

        document.getElementById("borderPalleteWrapper").style.display = "none";
        document.getElementById("fillPalleteWrapper").style.display = "block";
      }
    };
    var toggleOffButtons = function () {
      $("#pointCircleButton").removeClass("icon-selected");
      $("#pointDiamondButton").removeClass("icon-selected");
      $("#pointCrossButton").removeClass("icon-selected");
      $("#pointSquareButton").removeClass("icon-selected");
      $("#pointXButton").removeClass("icon-selected");
      $("#polygonButton").removeClass("icon-selected");
      $("#lineButton").removeClass("icon-selected");
      $("#polylineButton").removeClass("icon-selected");
      $("#freePolygonButton").removeClass("icon-selected");
      $("#freePolylineButton").removeClass("icon-selected");
      $("#triangleButton").removeClass("icon-selected");
      $("#circleButton").removeClass("icon-selected");
      $("#ellipseButton").removeClass("icon-selected");
    };

    var setPointStyle = function (pointStyle) {
      this.pointStyle = pointStyle;
    };

    var getPointStyle = function () {
      return this.pointStyle;
    };

    var clearTools = function () {
      toggleOffButtons();
      $("#lineButton").show();
      $("#polylineButton").show();
      $("#freePolylineButton").show();
      $("#pointCircleButton").show();
      $("#pointDiamondButton").show();
      $("#pointCrossButton").show();
      $("#pointSquareButton").show();
      $("#pointXButton").show();
      $("#polygonButton").show();
      $("#freePolygonButton").show();
      $("#triangleButton").show();
      $("#circleButton").show();
      $("#ellipseButton").show();
      document.getElementById("borderPaletteRow").style.display = "none";
      //document.getElementById("fillPaletteRow").style.display = "none";
      document.getElementById("markerPaletteRow").style.display = "none";
      document.getElementById("linePaletteRow").style.display = "none";
    };

    var addToMap = function (evt) {
      var symbol;
      var fColor = fillColorPicker.get("color");
      var lColor = lineColorPicker.get("color");
      var mColor = markerColorPicker.get("color");
      var bColor = borderColorPicker.get("color");
      var pStyle = getPointStyle();
      var pointStyle = "SimpleMarkerSymbol.STYLE_CIRCLE";
      switch (evt.geometry.type) {
        case "point":
        case "multipoint":
          var type = "point";
          switch (pStyle) {
            case "diamond":
              symbol = new SimpleMarkerSymbol(
                SimpleMarkerSymbol.STYLE_DIAMOND,
                10,
                new SimpleLineSymbol(),
                mColor
              );
              break;
            case "circle":
              symbol = new SimpleMarkerSymbol(
                SimpleMarkerSymbol.STYLE_CIRCLE,
                10,
                new SimpleLineSymbol(),
                mColor
              );
              break;
            case "cross":
              symbol = new SimpleMarkerSymbol(
                SimpleMarkerSymbol.STYLE_CROSS,
                10,
                new SimpleLineSymbol(),
                mColor
              );
              break;
            case "square":
              symbol = new SimpleMarkerSymbol(
                SimpleMarkerSymbol.STYLE_SQUARE,
                10,
                new SimpleLineSymbol(),
                mColor
              );
              break;
            case "x":
              symbol = new SimpleMarkerSymbol(
                SimpleMarkerSymbol.STYLE_X,
                10,
                new SimpleLineSymbol(),
                mColor
              );
              break;
          }
          break;
        case "polyline":
          var type = "line";
          symbol = new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            lColor,
            4
          );
          break;
        default:
          var type = "polygon";
          borderSymbol = new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            bColor,
            1
          );
          symbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            borderSymbol,
            fColor
          );
          break;
      }

      var attr = {
        Name: " ",
        Comment: " ",
        DateEntered: new Date().toLocaleString()
      };
      var infoTemplate = new InfoTemplate();
      if (graphicSelect.value !== "-Enter Graphics Layer Name-") {
        infoTemplate.setTitle("<b>" + graphicSelect.value + "</b>");
      }
      else {
        infoTemplate.setTitle("<b>User Defined Graphic</b>");
      }
      infoTemplate.setContent("<table style='width:100%;'><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Name: </b></td><td style='width:85%;'>${Name}</td></tr><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Comment: </b></td><td style='width:85%;white-space:pre;'>${Comment}</td></tr><tr><td colspan='2'><b>Updated: </b>${DateEntered}</td></tr></table>");

      /*infoTemplate.setContent(
        "<table style='width:100%;'><tr><td style='width:15%;'>Name:</td><td style='width:85%;'><input id='nameBox' name='nameBox' type='text' size=30 width='90%' value=${Name}></td></tr><tr><td style='width:15%;'>Comment:</td><td style='width:85%;'><textarea id='commentArea' name='nameArea'style='height:100px;width:90%;' rows='4'>${Comment}</textarea></td></tr><tr><td colspan='2'>Date Updated: ${DateEntered}</td></tr><tr><td colspan='2'><table width='100%'><tr><td style='width:50%;text-align:center;'><button id='SaveButton' onclick='saveGraphicAttributes(nameBox.value, commentArea.value);'>Save</button></td><td style='width:50%;text-align:center;'><button id='DeleteButton' onclick='deleteGraphic();'>Delete</button></td></td></table></td></tr></table>"
      );
      */
      var graphic = new Graphic(evt.geometry, symbol, attr, infoTemplate);
      //resize the info window
      map.infoWindow.resize(350, 240);

      map.graphics.add(graphic);

      var data = {};
      data.type = type;
      data.feature = graphic.geometry;
      data.format = "geojson";
      data.updates = {
        type: "add"
      };
      document.getElementById("unsavedChangesRow").style.display = "block";
      if (graphicSelect.value !== "-Enter Graphics Layer Name-") {
        dijit.byId("graphicSelect").attr("disabled", true);
      }
      sendProgress(data);
    };
  };

  window.saveGraphicAttributes = function (name, comment) {
    graphic = window.map.infoWindow.getSelectedFeature();
    graphic.setAttributes({
      Name: name,
      Comment: comment,
      DateEntered: new Date().toLocaleString()
    });

    window.map.graphics.redraw();
    window.map.infoWindow.hide();
  };

  window.deleteGraphic = function () {
    graphic = window.map.infoWindow.getSelectedFeature();
    //If the graphic layer hasn't been saved then it is in the map_graphics layer. 
    if (graphic._graphicsLayer && graphic._graphicsLayer.id == "map_graphics") {
      layer = map.getLayer("map_graphics");
      layer.remove(graphic);
      map.infoWindow.hide();
      editToolbar.deactivate();
      editToolbarActive = false;
      layer.redraw();
    }
    //If it has been saved we must find the layer containing the graphic then remove it from that layer. 
    else {
      layerIds = map.graphicsLayerIds;
      i = 0;
      contains = false;
      while (i < layerIds.length) {
        layer = map.getLayer(layerIds[i]);
        contains = layer.graphics.includes(graphic);
        if (contains) {
          layer.remove(graphic);
          map.infoWindow.hide();
          editToolbar.deactivate();
          editToolbarActive = false;
          layer.redraw();
        }
        i++;
      }
    }
    window.map.infoWindow.hide();
  };

  Draw.prototype.setLayer = function (overlayId, featureId, name) {
    this.overlayId = overlayId;
    this.name = name;
    this.featureId = featureId;
  };

  Draw.prototype.addGraphicsLayer = function (featureId, name) {
    graphicsStore.remove(name);
    graphicsStore.add({
      name: name,
      id: featureId
    });
    //Ensure the default text has been removed.
    graphicsStore.remove("-Enter Graphics Layer Name-");
  };

  return Draw;
});
