define(["esri/geometry/Extent", "esri/Color", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
    "plugins/JSUtilities"],
    function (Extent, Color, SimpleLineSymbol, SimpleFillSymbol, JSUtilities) {

        /*
         * @see {@link https://developers.arcgis.com/en/javascript/jsapi/extent-amd.html|Extent}
         * @see {@link https://developers.arcgis.com/en/javascript/jsapi/map-amd.html|Map}
         * @see {@link https://developers.arcgis.com/en/javascript/jsapi/layer-amd.html|Layer}
         */

        var unionExtents = function (newExtent, currentMax) {
            // console.log("ViewUtilities - unionExtents");

            if (currentMax === null) {
                return newExtent;
            } else {
                return currentMax.union(newExtent);
            }
        };

        var ViewUtilities = {

            /**
             * A high pixels (dots) per inch value for web displays.  Note:  This is an assumed value and
             * does not necessarily reflect the DPI of the current display.
             * @type number
             */
            HIGH_DPI: 120,
            /**
             * A low or default pixels (dots) per inch value for web displays.  Note:  This is an assumed
             * value and does not necessarily reflect the DPI of the current display.
             * @type number
             */
            DEFAULT_DPI: 96,
            /**
             * The value of sine(30 degrees).
             * @type number
             */
            SINE_30_DEG: Math.sin(0.523598776),
            /**
             * The value of sine(60 degrees).
             * @type number
             */
            SINE_60_DEG: Math.sin(1.04719755),
            /**
             * The number of inches in a meter.  This is used for unit conversions and calculations related to
             * assumed screen resolution.
             * @type number
             */
            INCHES_PER_METER: 39.37,

            DEFAULT_COLOR: "#504FB0DA",
            DEFAULT_LINEWIDTH: 2,
            DEFAULT_LINECOLOR: "#50000000",
            DEFAULT_LINESTYLE: SimpleLineSymbol.STYLE_SOLID,
            DEFAULT_FILLCOLOR: "#500F7CF8",
            DEFAULT_FILLSTYLE: SimpleFillSymbol.STYLE_SOLID,
            DEFAULT_OPACITY: 0.36,

            /**
             * Calculates the scale at which to simulate a view at the given altitude in meters. We are assuming
             * either an average 96 dpi or high 120 dpi for screen resolution since there's few reliable
             * ways to query that across a range of legacy browsers. Assuming an altitude above a flat map,
             * we can use the law of sines and an estimated view angle of 60 degrees to the left/right of
             * a viewer's centerline to determine how much of the map they can view.  This distance is then
             * converted to a scale value and set on the input map.  This course method assumes basic trigonometric
             * functions on a mercator projection and is not likely to be exact.  However, given that most basemaps
             * use discrete scales and zoom levels, this value will map to the nearest scale anyway and may
             * suffice for this application.
             * @todo Verify this approach;  it appears to work for now, but a more accurate or dpi-agnostic method may be preferred.
             * @param {Map} map An ArcGIS JavaScript map
             * @param {number} alt An viewing altitude in meters for which we need to find an equivalent scale.
             * @returns {number} A scale value appropriate to the input map.
             * @see http://resources.esri.com/help/9.3/arcgisserver/apis/silverlight/apiref/topic380.html
             */
            zoomAltitudeToScale: function (map, alt) {
                // console.log("ViewUtilities - zoomAltitudeToScale" );
                // (altitude in meters) * sin(60 deg) / sin(30 deg) to get half the view width in meters.
                var widthInMeters = (alt * this.SINE_60_DEG) / this.SINE_30_DEG;
                // scale = width in meters * 39.37 inches/meter * screen resolution / (0.5 * map.width)
                // map.width is halved because widgetInMeters represents half the user's view.
                // Using high dpi value here as it seems to match more closely with other map implementations.
                var scale = (widthInMeters * this.INCHES_PER_METER * this.HIGH_DPI) / (0.5 * map.width);
                return scale;
            },

            /**
             * Calculates the approximate zoom range in meters at which a map's current view/scale is set.  This makes the same
             * assumptions as the zoomAltitudeToScale function and simply reverses its mathematical process.
             * @todo Verify this approach;  it appears to work for now, but a more accurate or dpi-agnostic method may be preferred.
             * @param {Map} map An ArcGIS JavaScript map
             * @returns {number} A zoom range in meters.
             * @see http://resources.esri.com/help/9.3/arcgisserver/apis/silverlight/apiref/topic380.html
             */
            scaleToZoomAltitude: function (map) {
                // console.log("ViewUtilities - scaleToZoomAltitude" );
                // Calculate the range from the current scale using law of sines and a triangle from user's
                // viewpoint to center of extent, to the edge of the map. This assumes a user as a 120 degree field of view.
                // Triangle widthInMeters = scale * (1m / InchesPerMeter) * (1 / screen DPI) * (map width * 0.5).  We half
                // the map width in pixels since only half forms one side of our triangle to determine range.
                var widthInMeters = (map.getScale() * map.width * (0.5)) / (this.INCHES_PER_METER * this.HIGH_DPI);
                // Using law of sines, range = widthInMeters * sine(30 deg) / sine(60 deg).
                var range = (widthInMeters * this.SINE_30_DEG) / this.SINE_60_DEG;

                return range;
            },

            /**
             * Finds the outermost extent of an ArcGIS Layer.  This function is used to examine ArcGIS JavaScript Layers that have a
             * nested Layer structure and attempts to find the outmost layer that encompasses all contained data by performing a union
             * of all their extents.
             * @param {Layer} esriLayer An ArcGIS JavaScript Layer
             * @return {Extent}  The outermost extent
             */
            findLayerExtent: function (esriLayer) {
                // console.log("ViewUtilities - findLayerExtent" );
                var extent = null;
                try {
                    var layers = esriLayer.getLayers();
                }
                catch (exception) {
                    var layers = [esriLayer];
                }

                var layer;
                for (var i = 0; i < layers.length; i++) {
                    layer = layers[i];

                    if (typeof (layer.getLayers) !== 'undefined') { //kmlLayer
                        extent = unionExtents(this.findLayerExtent(layer), extent);
                    } else if (typeof (layer.getImages) !== 'undefined') { //mapImageLayer
                        var images = layer.getImages();
                        for (var j = 0; j < images.length; j++) {
                            extent = unionExtents(images[j].extent, extent);
                        }
                    } else { //featureLayer
                        extent = unionExtents(layer.fullExtent, extent);
                    }
                }
                return extent;
            },

            /**
             * Convenience function for finding the outermost extent of a CMWAPI feature.  This function pulls the equivalent
             * ArcGIS layer from the feature object and defers to findLayerExtent for the bulk of the work.
             * @param {cmwapi-adapter/EsriOverlayManager/Feature} feature A CMWAPI feature.
             * @return {Extent}  The outermost extent
             */
            findFeatureExtent: function (feature) {
                // console.log("ViewUtilities - findFeatureExtent" );
                return this.findLayerExtent(feature.esriObject);
            },

            /**
             * Finds the outermost Extent of a CMWAPI Overlay.  This function traverses the overlay's child overlays and feature
             * and unions the extents of all ArcGIS Layers contained therein.  The composite Extent is returned.
             * @param {cmwapi-adapter/EsriOverlayManager/Overlay} overlay A CMWAPI overlay.
             * @return {Extent} The outermost extent.
             */
            findOverlayExtent: function (overlay) {
                // console.log("ViewUtilities - findOverlayExtent" );
                var extent = null;
                var idx = null;

                // Get the max extent of the features in this overlay.
                if (typeof (overlay.features) !== 'undefined') {
                    //for (var i = 0; i < overlay.features.length; i++) {
                    for (idx in overlay.features) {
                        if (overlay.features[idx].format !== 'wms' && overlay.features[idx].format !== 'wms-url') {
                            extent = unionExtents(this.findFeatureExtent(overlay.features[idx]), extent);
                        }
                    }
                }

                // Recursively check any child overlays
                if (typeof (overlay.children) !== 'undefined') {
                    for (idx in overlay.children) {
                        extent = unionExtents(this.findOverlayExtent(overlay.children[idx]), extent);
                    }
                }
                return extent;
            },

            // https://developers.arcgis.com/javascript/3/sandbox/sandbox.html?sample=fl_popup
            pointToExtent: function (map, point, toleranceInPixel) {
                // console.log("ViewUtilities - pointToExtent" );
                var pixelWidth = map.extent.getWidth() / map.width;
                var toleranceInMapCoords = toleranceInPixel * pixelWidth;

                return new Extent(Number(point.x) - toleranceInMapCoords,
                    Number(point.y) - toleranceInMapCoords,
                    Number(point.x) + toleranceInMapCoords,
                    Number(point.y) + toleranceInMapCoords,
                    map.spatialReference);
            },

            getColor: function (color, opacity, colorMode) {
                // console.log("ViewUtilities - getColor" );
                if ((opacity === null) || (opacity === undefined)) {
                    opacity = this.DEFAULT_OPACITY * 255;
                } else {
                    opacity = opacity * 255;
                }

                if (color) {
                    let featureColor;

                    if (Array.isArray(color)) {
                        if (color.length === 4) {
                            featureColor = new Color([color[0], color[1], color[2], (opacity || color[3] || 100)]);
                        } else if (color.length === 3) {
                            featureColor = new Color([color[0], color[1], color[2], (opacity || 100)]);
                        }
                    } else if (typeof color === "object") {
                        if (('r' in color) && ('g' in color) && ('b' in color) && !('a' in color)) {
                            featureColor = new Color([color.r, color.g, color.b, (opacity || 100)]);
                        } else if (('r' in color) && ('g' in color) && ('b' in color) && ('a' in color)) {
                            featureColor = new Color([color.r, color.g, color.b, (opacity || color.a || 100)]);
                        }
                    } else {
                        if (!color.startsWith("#")) {
                            color = "#" + color;
                        }

                        if ((opacity === null) || (opacity === undefined)) {
                            if (color.length > 8) {
                                opacity = parseInt(color.substring(7, 9), 16);
                            } else {
                                opacity = 100;
                            }
                        }

                        featureColor = new Color([parseInt(color.substring(1, 3), 16),
                        parseInt(color.substring(3, 5), 16),
                        parseInt(color.substring(5, 7), 16), opacity]);
                    }

                    if (featureColor) {
                        if (colorMode && colorMode === "random") {
                            featureColor = JSUtilities.getRandomColor(featureColor);
                        }
                        return featureColor;
                    }
                }

                return this.getColor(this.DEFAULT_COLOR);
            },

            zoomToLayer: function (map, layer) {
                // console.log("ViewUtilities - zoomToLayer" );
                if (layer.hasOwnProperty("fullExtent")) {
                    map.setExtent(layer.fullExtent);
                } else {
                    let projectParams = new esri.tasks.ProjectParameters();
                    projectParams.geometries = [layer.initialExtent];
                    projectParams.outSR = map.spatialReference;
                    esriConfig.defaults.geometryService = new esri.tasks.GeometryService(window.esriGeometryService);

                    let defer = esriConfig.defaults.geometryService.project(projectParams);
                    dojo.when(defer, function (projectedGeometry) {
                        if (projectedGeometry.length > 0) {
                            map.setExtent(projectedGeometry[0], true);
                        }
                    });
                }
            }
        };

        return ViewUtilities;
    });