/**
    * This software is the property of the U.S. Government.
    * Developed by ESRI for the United States Coast Guard 
    * under contract number 40024142.     
    *
    * @version 1.1.x
    *
    * @module cmwapi-adapter/Feature
    */

define(["app/extensions/feature/Status",
    "app/extensions/feature/Draw",
    "app/extensions/feature/Edit",
    "digits/quickIcon/js/quickicon",
    "esri/dijit/editing/TemplatePicker",
    "esri/toolbars/draw",
    "esri/graphic",
    "esri/dijit/editing/Editor",
    "esri/dijit/editing/TemplatePicker",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/TimeExtent",
    "esri/dijit/TimeSlider",
    "esri/dijit/OverviewMap",
    "esri/geometry/Extent",
    "dojo/dom",
    "dojo/_base/array",
    "dijit/registry",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin"], function (Status, Draw, Edit, QuickIcon, TemplatePicker, DrawToolbar, Graphic, Editor, TemplatePicker, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TimeExtent, TimeSlider, OverviewMap, Extent, dom, arrayUtils, registry, _TemplatedMixin, _WidgetsInTemplatedMixin) {

        var Feature = function (adapter, overlayManager, map) {
            var me = this;

            me.status = new Status(overlayManager, map);
            me.drawTool = new Draw({ map: map, overlayManager: overlayManager });
            me.overviewMap = new OverviewMap({ map: map });
            me.overviewMap.startup();
            me.quickIcon = new QuickIcon({ map: map, overlayManager: overlayManager });
            map.QuickIcon = me.quickIcon;
            
            me.startExtent;
            me.minZoom;
            me.maxZoom;
            me.previousExtent = map.extent;
            me.extentLimitsSet = false;

            map.on('extent-change', function (params) {
                if (me.extentLimitsSet) {
                    if (!me.startExtent) {
                        me.startExtent = map.extent;
                    }
                    var intersects = params.extent.intersects(me.startExtent);
                    if (!intersects) {
                        var center = params.extent.getCenter();
                        intersects = me.startExtent.contains(center);
                    }
                    if (intersects) {
                        me.previousExtent = params.extent;
                    }
                    else {
                        map.setExtent(me.previousExtent, true)
                    }
                    var mapZoom = map.getZoom()
                    if (mapZoom < me.minZoom) {
                        map.setZoom(me.minZoom)
                    }
                    if (mapZoom > me.maxZoom) {
                        map.setZoom(me.maxZoom)
                    }
                }
            });

            //me.templatePicker;
            //me.editTool = new Edit({ map: map, overlayManager: overlayManager });

            me.handleAddExtentLimits = function (sender, data) {
                me.extentLimitsSet = true;
                var extentLimit = new Extent(data.extent);
                me.startExtent = extentLimit;
                me.previousExtent = me.startExtent;
                if (data.zoom.minZoom) {
                    me.minZoom = data.zoom.minZoom;
                }
                if (data.zoom.maxZoom) {
                    me.maxZoom = data.zoom.maxZoom;
                }
                map.setExtent(me.startExtent, true);
            };
            /*
            CommonMapApi.feature.addExtentLimits.addHandler(me.handleAddExtentLimits);
            */

            me.handleRemoveExtentLimits = function (sender, data) {
                me.extentLimitsSet = false;
            };
            /*
            CommonMapApi.feature.removeExtentLimits.addHandler(me.handleRemoveExtentLimits);
            */

            me.testLoad = function (evt) {
                var layerInfos = [], map = evt.map;

                arrayUtils.forEach(map.layerIds, function (id) {
                    var layer = map.getLayer(id);
                    layerInfos.push({ featureLayer: layer });
                });
                // var layer = map.getLayer(data.featureId);
                me.templatePicker = new TemplatePicker({
                    featureLayers: layerInfos,
                    grouping: true,
                    rows: "auto",
                    columns: 3
                }, "templateDiv");
                me.templatePicker.startup();


                //$('#edit_wrapper').show();
            };


            /**
             * Handler for plot feature request
             * @method handlePlot
             * @param sender {String} the widget which made the plot feature request
             * @param data {Object|Object[]}
             * @param data.overlayId {String} The Id of the overlay to which the feature should be plotted.
             * @param data.featureId {String} The id to be given to the feature; unique to the overlayId.
             * @param data.name {String} The non-unique readable name to be given to the feature.
             * @param data.format {String} The format type of the feature data
             * @param data.feature The data for the feature to be plotted
             * @param [data.zoom] {Boolean} Whether or not the feature should be zoomed to when plotted.
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handlePlot = function (sender, data) {
                if (data.length > 1) {
                    var data_item;
                    for (var i = 0; i < data.length; i++) {
                        data_item = data[i];

                        var properties = {};
                        if (data_item.properties) {
                            properties = data_item.properties;
                        }
                        if (data_item.params) {
                            Object.keys(datdata_itema.params).forEach(function (index) {
                                if (!properties.hasOwnProperty(index)) {
                                    properties[index] = data_item.params[index];
                                }
                            });
                        }

                        var popupTemplate = {};
                        if (data.popupTemplate) {
                            popupTemplate = data.popupTemplate;
                        }
                        overlayManager.feature.plotFeature(sender, data_item.overlayId, data_item.featureId, data_item.name,
                            data_item.format, data_item.feature, data_item.zoom, properties, popupTemplate);
                    }
                } else {
                    var properties = {};
                    if (data.properties) {
                        properties = data.properties;
                    }
                    if (data.params) {
                        Object.keys(data.params).forEach(function (index) {
                            if (!properties.hasOwnProperty(index)) {
                                properties[index] = data.params[index];
                            }
                        });
                    }

                    var popupTemplate = {};
                    if (data.popupTemplate) {
                        popupTemplate = data.popupTemplate;
                    }
                    overlayManager.feature.plotFeature(sender, data.overlayId, data.featureId, data.name,
                        data.format, data.feature, data.zoom, properties, popupTemplate);
                    if (data.format == "graphics") {
                        me.drawTool.addGraphicsLayer(data.featureId, data.name);
                    }
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.plot.addHandler(me.handlePlot);
            */

            me.handleAddTimeslider = function (sender, data) {

                $('#bottomPanel').show();
                if (!me.timeSlider) {
                    me.timeSlider = new TimeSlider({
                    }, dom.byId("timeSliderDiv"));
                    map.setTimeSlider(me.timeSlider);
                }

                if (data.timeExtent) {
                    var timeExtent = new TimeExtent();
                    timeExtent.startTime = new Date(data.timeExtent.startTime);
                    timeExtent.endTime = new Date(data.timeExtent.endTime);
                }
                if (data.thumbCount) {
                    me.timeSlider.setThumbCount(data.thumbCount);
                }

                if (data.timeInterval && data.timeIntervalUnits && data.timeExtent) {
                    me.timeSlider.createTimeStopsByTimeInterval(timeExtent, data.timeInterval, data.timeIntervalUnits);
                }

                else if (data.intervalCount && data.timeExtent) {
                    me.timeSlider.createTimeStopsByCount(timeExtent, data.intervalCount);
                }

                else if (data.timeExtent) {
                    me.timeSlider.createTimeStopsByTimeInterval(timeExtent);
                }

                else if (data.timeStops) {
                    me.timeSlider.setTimeStops(data.timeStops);
                }

                if (data.thumbIndexes) {
                    me.timeSlider.setThumbIndexes(data.thumbIndexes);
                }
                if (data.thumbMovingRate) {
                    me.timeSlider.setThumbMovingRate(data.thumbMovingRate);
                }
                if (data.labels) {
                    me.timeSlider.setLabels(data.labels);
                }
                else {
                    var labels = arrayUtils.map(me.timeSlider.timeStops, function (timeStop, i) {
                        if (i % 2 === 0) {
                            return timeStop.getUTCFullYear();
                        } else {
                            return "";
                        }
                    });
                    me.timeSlider.setLabels(labels);
                }
                if (data.loop) {
                    me.timeSlider.setLoop(data.loop);
                }
                if (data.tickCount) {
                    me.timeSlider.setTickCount(data.tickCount);
                }

                me.timeSlider.startup();
            };
            /*
            CommonMapApi.feature.addTimeslider.addHandler(me.handleAddTimeslider);
            */

            me.handleRemoveTimeslider = function (sender, data) {
                $('#bottomPanel').hide();
                var timeExtent = new TimeExtent();
                timeExtent.startTime = null;
                timeExtent.endTime = null;
                this.map.setTimeExtent(timeExtent);
            };
            /*
            CommonMapApi.feature.removeTimeslider.addHandler(me.handleRemoveTimeslider);
            */

            /**
             * Handler for plot feature request
             * @method handlePlot
             * @param sender {String} the widget which made the plot feature request
             * @param data {Object|Object[]}
             * @param data.overlayId {String} The Id of the overlay to which the feature should be plotted.
             * @param data.featureId {String} The id to be given to the feature; unique to the overlayId.
             * @param data.name {String} The non-unique readable name to be given to the feature.
             * @param data.format {String} The format type of the feature data
             * @param data.feature The data for the feature to be plotted
             * @param [data.zoom] {Boolean} Whether or not the feature should be zoomed to when plotted.
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handlePlotBatch = function (sender, data) {
                var plot_feature;
                for (var i = 0; i < data.features.length; i++) {
                    plot_feature = data.features[i];
                    if (!plot_feature.format) {
                        plot_feature.format = data.format
                    }

                    plot_feature.properties = {};
                    if (data.properties) {
                        plot_feature.properties = data.properties;
                    }
                    if (data.params) {
                        Object.keys(data.params).forEach(function (index) {
                            if (!plot_feature.properties.hasOwnProperty(index)) {
                                plot_feature.properties[index] = data.params[index];
                            }
                        });
                    }

                    plot_feature.popupTemplate = {};
                    if (data.popupTemplate) {
                        popupTemplate = data.popupTemplate;
                    }

                    overlayManager.feature.plotFeature(sender, data.overlayId, plot_feature.featureId, plot_feature.name,
                        plot_feature.format, plot_feature.feature, data.zoom, plot_feature.properties, plot_feature.popupTemplate);
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.plotBatch.addHandler(me.handlePlotBatch);
            */

            /**
             * Handler for plot url request
             * @method handlePlot
             * @param sender {String} the widget which made the feature plot url request
             * @param data {Object|Object[]}
             * @param data.overlayId {String} The Id of the overlay to which the feature should be plotted.
             * @param data.featureId {String} The id to be given to the feature; unique to the overlayId.
             * @param data.name {String} The non-unique readable name to be given to the feature.
             * @param data.format {String} The format type of the feature data
             * @param data.url {String} The url for where the feature data could be retrieved
             * @param [data.zoom] {Boolean} Whether or not the feature should be zoomed to when plotted.
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handlePlotUrl = function (sender, data) {
                if (data.length > 1) {
                    var data_item;
                    for (var i = 0; i < data.length; i++) {
                        data_item = data[i];
                        overlayManager.feature.plotFeatureUrl(sender, data_item.overlayId, data_item.featureId, data_item.name,
                            data_item.format, data_item.url, data_item.params, data_item.zoom);
                    }
                } else {
                    overlayManager.feature.plotFeatureUrl(sender, data.overlayId, data.featureId, data.name, data.format, data.url,
                        data.params, data.zoom);
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.plot.url.addHandler(me.handlePlotUrl);
            */

            /**
             * Handler for feature unplot request
             * @method handleUnplot
             * @param sender {String} the widget which made the feature unplot request
             * @param data {Object|Object[]}
             * @param data.overlayId {String} optional; the id for the overlay from which the feature should be
             *      unplotted. If not provided, the id of the sender will be assumed
             * @param data.featureId {String} The id of the feature to unplot
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handleUnplot = function (sender, data) {
                if (data.length > 1) {
                    var data_item;
                    for (var i = 0; i < data.length; i++) {
                        data_item = data[i];
                        overlayManager.feature.deleteFeature(sender, data_item.overlayId, data_item.featureId);
                    }
                } else {
                    overlayManager.feature.deleteFeature(sender, data.overlayId, data.featureId);
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.unplot.addHandler(me.handleUnplot);
            */

            /**
            * Handler for feature unplot request
            * @method handleUnplot
            * @param sender {String} the widget which made the feature unplot request
            * @param data {Object|Object[]}
            * @param data.overlayId {String} optional; the id for the overlay from which the feature should be
            *      unplotted. If not provided, the id of the sender will be assumed
            * @param data.featureId {String} The id of the feature to unplot
            * @memberof module:cmwapi-adapter/Feature#
            */
            me.handleUnplotBatch = function (sender, data) {
                var features = data.features;
                var overlayId = data.overlayId;
                if (!overlayId) {
                    var overlayId = sender;
                }
                if (features.length > 0) {
                    for (var i = 0; i < features.length; i++) {
                        if (!features[i].overlayId) {
                            features[i].overlayId = overlayId;
                        }
                        overlayManager.feature.deleteFeature(sender, features[i].overlayId, features[i].featureId);
                    }
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.unplotBatch.addHandler(me.handleUnplotBatch);
            */

            /**
             * Handler for request to hide feature
             * @method handleHide
             * @param sender {String} the widget which made the feature hide request
             * @param data {Object|Object[]}
             * @param data.overlayId {String} optional; the id for the overlay from which the feature should be
             *      hidden. If not provided, the id of the sender will be assumed
             * @param data.featureId {String} The id of the feature to hide
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handleHide = function (sender, data) {
                if (data.length > 1) {
                    var data_item;
                    for (var i = 0; i < data.length; i++) {
                        data_item = data[i];
                        overlayManager.feature.hideFeature(sender, data_item.overlayId, data_item.featureId);
                    }
                } else {
                    overlayManager.feature.hideFeature(sender, data.overlayId, data.featureId);
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.hide.addHandler(me.handleHide);
            */

            /**
             * Handler for request to show feature
             * @method handleShow
             * @param sender {String} The id of the widget making the request to show the feature
             * @param data {Object|Object[]}
             * @param data.overlayId {String} The id of the overlay to which the feature to show belongs
             * @param data.featureId {Stirng} The id of the feature which should be shown
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handleShow = function (sender, data) {
                if (data.length > 1) {
                    var data_item;
                    for (var i = 0; i < data.length; i++) {
                        data_item = data[i];
                        overlayManager.feature.showFeature(sender, data_item.overlayId, data_item.featureId, data_item.zoom);
                    }
                } else {
                    overlayManager.feature.showFeature(sender, data.overlayId, data.featureId, data.zoom);
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.show.addHandler(me.handleShow);
            */

            /**
             * Handler for a given feature being selected
             * @method handleSelected
             * @param {String} sender The widget sending a format message
             * @param {Object|Object[]} data  A data object or array of data objects.
             * @param {String} data.overlayId The ID of the overlay.
             * @param {String} data.featureId The ID of the feature.
             * @param {String} [data.selectedId] The ID of the actual selected object.  This may be an implementation
             *    specific subfeature id for data within an aggregated feature.
             * @param {String} [data.selectedName] The name of the selected object.
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handleSelected = function (sender, data) {

                if (OWF.getInstanceId() !== sender) {
                    if (data.length > 1) {
                        var data_item;
                        for (var i = 0; i < data.length; i++) {
                            data_item = data[i];
                            overlayManager.feature.centerFeatureGraphic(sender, data_item.overlayId, data_item.featureId, data_item.selectedId, data_item.selectedName);
                        }
                    } else {
                        overlayManager.feature.centerFeatureGraphic(sender, data.overlayId, data.featureId, data.selectedId, data.selectedName);
                    }
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.selected.addHandler(me.handleSelected);
            */

            /**
             * Handler for a given batch of features being selected
             * @method handleSelectedBatch
             * @param {String} sender The widget sending a format message
             * @param {Object|Object[]} data  A data object or array of data objects.
             * @param {String} data.overlayId The ID of the overlay.
             * @param {Object|Object[]} data.features An array of feature.selected objects for the selected features.         
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handleSelectedBatch = function (sender, data) {

                if (OWF.getInstanceId() !== sender) {
                    if (data.length > 1) {
                        var data_item;
                        for (var i = 0; i < data.length; i++) {
                            data_item = data[i];
                            //overlayManager.feature.centerFeatureGraphic(sender, data_item.overlayId, data_item.featureId, data_item.selectedId, data_item.selectedName);
                        }
                    } else {
                        //overlayManager.feature.centerFeatureGraphic(sender, data.overlayId, data.featureId, data.selectedId, data.selectedName);
                    }
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.selected.addHandler(me.handleSelectedBatch);
            */

            /**
             * Handler for a given feature being deselected
             * @method handleDeselected
             * @param {String} sender The widget sending a format message
             * @param {Object|Object[]} data  A data object or array of data objects.
             * @param {String} data.overlayId The ID of the overlay.
             * @param {String} data.featureId The ID of the feature.
             * @param {String} [data.deSelectedId] The ID of the actual selected object.  This may be an implementation
             *    specific subfeature id for data within an aggregated feature.
             * @param {String} [data.deSelectedName] The name of the selected object.
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handleDeselected = function (sender, data) {
                //overlayManager.feature.closeInfoWindow();
                if (OWF.getInstanceId() !== sender) {
                    if (data.length > 1) {
                        var data_item;
                        for (var i = 0; i < data.length; i++) {
                            data_item = data[i];
                            overlayManager.feature.centerFeatureGraphic(sender, data_item.overlayId, data_item.featureId, data_item.deSelectedId, data_item.deSelectedName);
                        }
                    } else {
                        overlayManager.feature.centerFeatureGraphic(sender, data.overlayId, data.featureId, data.deSelectedId, data.deSelectedName);
                    }
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.deselected.addHandler(me.handleDeselected);
            */

            /**
             * Handler for a given batch of features being deselected
             * @method handleDeselectedBatch
             * @param {String} sender The widget sending a format message
             * @param {Object|Object[]} data  A data object or array of data objects.
             * @param {String} data.overlayId The ID of the overlay.
             * @param {Object|Object[]} data.features An array of feature.deselected objects for the selected features.         
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handleDeselectedBatch = function (sender, data) {

                if (OWF.getInstanceId() !== sender) {
                    if (data.length > 1) {
                        var data_item;
                        for (var i = 0; i < data.length; i++) {
                            data_item = data[i];
                            //overlayManager.feature.centerFeatureGraphic(sender, data_item.overlayId, data_item.featureId, data_item.selectedId, data_item.selectedName);
                        }
                    } else {
                        //overlayManager.feature.centerFeatureGraphic(sender, data.overlayId, data.featureId, data.selectedId, data.selectedName);
                    }
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.selected.addHandler(me.handleDeselectedBatch);
            */

            /**
             * Handler for request to update a feature
             * @method handleUpdate
             * @param Sender {String} The id of the widgets making the request to update the feature
             * @param data {Object|Object[]}
             * @param data.overlayId {String} The id of the overlay for which the feature to be updated belongs.
             * @param data.featureId {String} The id of the feature to be updated; unique to the given overlayId
             * @param [data.name] {String} the optional name to be set for the feature; If not provided, the name will not be changed.
             * @param [data.newOverlayId] {String} The optional id of the new overlay for which the feature should belong. If not
             *      provided the parent overlay will not be changed.
             * @memberof module:cmwapi-adapter/Feature#
             */
            me.handleUpdate = function (sender, data) {
                if (data.length > 1) {
                    var data_item;
                    for (var i = 0; i < data.length; i++) {
                        data_item = data[i];
                        overlayManager.feature.updateFeature(sender, data_item.overlayId, data_item.featureId, data_item.name, data_item.newOverlayId);
                    }
                } else {
                    overlayManager.feature.updateFeature(sender, data.overlayId, data.featureId, data.name, data.newOverlayId);
                }
                //overlayManager.archiveState();
            };
            /*
            CommonMapApi.feature.update.addHandler(me.handleUpdate);
            */

            me.handleDraw = function (sender, data) {
                //me.drawTool.setLayer(data.overlayId, data.featureId, data.name);            
                $('#overlayId').val(data.overlayId);
                $('#featureId').val(data.featureId);
                $('#name').val(data.name);
                $('#type').val(data.type);
                switch (data.type) {
                    case "line":
                        $('#lineButton').show();
                        $('#polylineButton').show();
                        $('#freePolylineButton').show();
                        $("#pointCircleButton").hide();
                        $("#pointDiamondButton").hide();
                        $("#pointCrossButton").hide();
                        $("#pointSquareButton").hide();
                        $("#pointXButton").hide();
                        $('#polygonButton').hide();
                        $('#freePolygonButton').hide();
                        $('#triangleButton').hide();
                        $('#circleButton').hide();
                        $('#ellipseButton').hide();
                        document.getElementById("borderPaletteRow").style.display = "none";
                        //document.getElementById("fillPaletteRow").style.display = "none";
                        document.getElementById("markerPaletteRow").style.display = "none";
                        document.getElementById("linePaletteRow").style.display = "block";
                        break;
                    case "point":
                        $('#lineButton').hide();
                        $('#polylineButton').hide();
                        $('#freePolylineButton').hide();
                        $("#pointCircleButton").show();
                        $("#pointDiamondButton").show();
                        $("#pointCrossButton").show();
                        $("#pointSquareButton").show();
                        $("#pointXButton").show();
                        $('#polygonButton').hide();
                        $('#freePolygonButton').hide();
                        $('#triangleButton').hide();
                        $('#circleButton').hide();
                        $('#ellipseButton').hide();
                        document.getElementById("borderPaletteRow").style.display = "none";
                        document.getElementById("fillPaletteRow").style.display = "none";
                        document.getElementById("linePaletteRow").style.display = "none";
                        document.getElementById("markerPaletteRow").style.display = "block";
                        break;
                    case "circle":
                        $('#lineButton').hide();
                        $('#polylineButton').hide();
                        $('#freePolylineButton').hide();
                        $("#pointCircleButton").hide();
                        $("#pointDiamondButton").hide();
                        $("#pointCrossButton").hide();
                        $("#pointSquareButton").hide();
                        $("#pointXButton").hide();
                        $('#polygonButton').hide();
                        $('#freePolygonButton').hide();
                        $('#triangleButton').hide();
                        $('#circleButton').show();
                        $('#ellipseButton').show();
                        document.getElementById("linePaletteRow").style.display = "none";
                        document.getElementById("markerPaletteRow").style.display = "none";
                        document.getElementById("fillPaletteRow").style.display = "block";
                        break;
                    case "polygon":
                        $('#lineButton').hide();
                        $('#polylineButton').hide();
                        $('#freePolylineButton').hide();
                        $("#pointCircleButton").hide();
                        $("#pointDiamondButton").hide();
                        $("#pointCrossButton").hide();
                        $("#pointSquareButton").hide();
                        $("#pointXButton").hide();
                        $('#polygonButton').show();
                        $('#freePolygonButton').show();
                        $('#triangleButton').hide();
                        $('#circleButton').hide();
                        $('#ellipseButton').hide();
                        document.getElementById("linePaletteRow").style.display = "none";
                        //document.getElementById("borderPaletteRow").style.display = "block";
                        document.getElementById("markerPaletteRow").style.display = "none";
                        document.getElementById("fillPaletteRow").style.display = "block";
                        break;
                    default:
                        $('#lineButton').show();
                        $('#polylineButton').show();
                        $('#freePolylineButton').show();
                        $("#pointCircleButton").hide();
                        $("#pointDiamondButton").hide();
                        $("#pointCrossButton").hide();
                        $("#pointSquareButton").hide();
                        $("#pointXButton").hide();
                        $('#polygonButton').hide();
                        $('#freePolygonButton').hide();
                        $('#triangleButton').hide();
                        $('#circleButton').hide();
                        $('#ellipseButton').hide();
                        document.getElementById("borderPaletteRow").style.display = "none";
                        document.getElementById("fillPaletteRow").style.display = "none";
                        document.getElementById("markerPaletteRow").style.display = "none";
                        document.getElementById("linePaletteRow").style.display = "block";
                        break;
                }
                $('#draw_wrapper').show();
            };
            /*
            CommonMapApi.feature.draw.addHandler(me.handleDraw);
            */

            me.handleEdit = function (sender, data) {
                layerId = data.featureId;
                layer = map.getLayer(layerId);
                layers = [layer];
                me.templatePicker.attr("featureLayers", layers);
                me.templatePicker.update();


                var layerInfos = [];
                layerInfos.push({ featureLayer: layer });


                var settings = {
                    map: map,
                    templatePicker: me.templatePicker,
                    layerInfos: layerInfos,
                    toolbarVisible: true,
                    createOptions: {
                        polylineDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYLINE],
                        polygonDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYGON,
                        Editor.CREATE_TOOL_CIRCLE,
                        Editor.CREATE_TOOL_TRIANGLE,
                        Editor.CREATE_TOOL_RECTANGLE
                        ]
                    },
                    toolbarOptions: {
                        reshapeVisible: true
                    }
                };
                var params = {
                    settings: settings
                };

                me.editor = new Editor(params, 'editorDiv');
                me.editor.startup();

                $('#edit_wrapper').show();
            };
            /*
            CommonMapApi.feature.edit.addHandler(me.handleEdit);
            */

            me.handleQuery = function (sender, data) {
                var response = {};
                response.features = [];
                if (data.overlayIds) {
                    for (var overlay in data.overlayIds) {
                        var overlayObj = overlayManager.overlays[data.overlayIds[overlay]];
                        for (var feature in overlayObj.features) {
                            var newFeature = {};
                            newFeature.url = overlayObj.features[feature].feature;
                            newFeature.featureId = overlayObj.features[feature].featureId;
                            newFeature.format = overlayObj.features[feature].format;
                            newFeature.name = overlayObj.features[feature].name;
                            newFeature.isHidden = overlayObj.features[feature].isHidden;
                            newFeature.overlayId = overlayObj.features[feature].overlayId;
                            newFeature.params = overlayObj.features[feature].params;
                            newFeature.zoom = overlayObj.features[feature].zoom;
                            response.features.push(newFeature);
                        }
                    };
                }
                else {
                    for (var overlay in overlayManager.overlays) {
                        var overlayObj = overlayManager.overlays[overlay];
                        for (var feature in overlayObj.features) {
                            var newFeature = {};
                            newFeature.url = overlayObj.features[feature].feature;
                            newFeature.featureId = overlayObj.features[feature].featureId;
                            newFeature.format = overlayObj.features[feature].format;
                            newFeature.name = overlayObj.features[feature].name;
                            newFeature.isHidden = overlayObj.features[feature].isHidden;
                            newFeature.overlayId = overlayObj.features[feature].overlayId;
                            newFeature.params = overlayObj.features[feature].params;
                            newFeature.zoom = overlayObj.features[feature].zoom;
                            response.features.push(newFeature);
                        }
                    };
                }

                /*
                CommonMapApi.feature.query.send(response);
                */
            };
            /*
            CommonMapApi.feature.query.addHandler(me.handleQuery);
            */

            me.handleOverviewmapShow = function (sender, data) {
                me.overviewMap.show();
            };
            /*
            CommonMapApi.feature.overviewmapShow.addHandler(me.handleOverviewmapShow);
            */

            me.handleOverviewmapHide = function (sender, data) {
                me.overviewMap.hide();
            };
            /*
            CommonMapApi.feature.overviewmapHide.addHandler(me.handleOverviewmapHide);
            */
        };

        return Feature;
    });