define(["esri/geometry/Extent"],
    function (Extent) {

        /*
         * @see {@link https://developers.arcgis.com/en/javascript/jsapi/extent-amd.html|Extent}
         * @see {@link https://developers.arcgis.com/en/javascript/jsapi/map-amd.html|Map}
         * @see {@link https://developers.arcgis.com/en/javascript/jsapi/layer-amd.html|Layer}
         */

        var unionExtents = function (newExtent, currentMax) {
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
                var extent = null;
                try {
                    var layers = esriLayer.getLayers();
                }
                catch (err) {
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
                return this.findLayerExtent(feature.esriObject);
            },

            /**
             * Finds the outermost Extent of a CMWAPI Overlay.  This function traverses the overlay's child overlays and feature
             * and unions the extents of all ArcGIS Layers contained therein.  The composite Extent is returned.
             * @param {cmwapi-adapter/EsriOverlayManager/Overlay} overlay A CMWAPI overlay.
             * @return {Extent} The outermost extent.
             */
            findOverlayExtent: function (overlay) {
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
                var pixelWidth = map.extent.getWidth() / map.width;
                var toleranceInMapCoords = toleranceInPixel * pixelWidth;

                return new Extent(Number(point.x) - toleranceInMapCoords,
                    Number(point.y) - toleranceInMapCoords,
                    Number(point.x) + toleranceInMapCoords,
                    Number(point.y) + toleranceInMapCoords,
                    map.spatialReference);
            },

            getBoolean: function (value) {
                // empty/null match
                if ((value === null) || (value === undefined) || (value === NaN)) {
                    return false;
                }

                // match native value
                if (typeof value === "number") {
                    switch (value) {
                        case 0: case false: return false;
                        default: return true;
                    }
                }

                // match boolean value
                if (typeof value === "boolean") {
                    return value;
                }

                // match string value
                if (typeof value === "string") {
                    switch (value.toLowerCase()) {
                        case "error": case "reject": case "closed": case "hide": case "hidden":
                        case "false": case "off": case "no": case "none":
                        case "0": return false;
                        default: return true;
                    }
                }

                // match array value
                if (Array.isArray(value)) {
                    if (value.length > 0) {
                        return true;
                    } else {
                        return false;
                    }
                }

                // match object value
                if (typeof value === "object") {
                    if (Object.keys(value).length > 0) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },

            _numberToHex: function (value) {
                var hex = Number(value).toString(16);
                return (hex.length < 2) ? "0" + hex : hex;
            },

            getRandomColor: function (color) {
                let aa = "ff";
                let bb = "ff";
                let gg = "ff";
                let rr = "ff";

                if (Array.isArray(color)) {
                    if (color.length === 4) {
                        color = this._numberToHex(color[0]) + this._numberToHex(color[1]) + this._numberToHex(color[2]) + this._numberToHex(color[3]);
                    } else if (color.length === 3) {
                        color = this._numberToHex(color[0]) + this._numberToHex(color[1]) + this._numberToHex(color[2]) + "ff";
                    }
                } else if (typeof color === "object") {
                    if (('r' in color) && ('g' in color) && ('b' in color) && !('a' in color)) {
                        color = this._numberToHex(color.r) + this._numberToHex(color.g) + this._numberToHex(color.b) + "ff";
                    } else if (('r' in color) && ('g' in color) && ('b' in color) && ('a' in color)) {
                        color = this._numberToHex(color.r) + this._numberToHex(color.g) + this._numberToHex(color.b) + this._numberToHex(color.a);
                    }
                }

                if (!color.startsWith("#")) {
                    color = "#" + (color || "ffffffff");
                }

                if (color && color.length >= 6) {
                    rr = color.substring(1, 3);
                    gg = color.substring(3, 5);
                    bb = color.substring(5, 7);

                    if (color.length > 8) {
                        aa = color.substring(7, 9);
                    }
                }

                if (bb == "ff") {
                    bb = Math.round(parseInt(bb, 16) * Math.random()).toString(16);
                }
                if (gg == "ff") {
                    gg = Math.round(parseInt(gg, 16) * Math.random()).toString(16);
                }
                if (rr == "ff") {
                    rr = Math.round(parseInt(rr, 16) * Math.random()).toString(16);
                }

                return "#" + rr + gg + bb + aa;
            },

            // https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
            // Version 4.0
            colorShadeBlendConvert: function (percent, fromColor, toColor, linear) {
                let r, g, b, P, f, t, h, i = parseInt, m = Math.round, a = typeof (toColor) == "string";
                if (typeof (percent) != "number" || percent < -1 || percent > 1 || typeof (fromColor) != "string" || (fromColor[0] != 'r' && fromColor[0] != '#') || (toColor && !a)) return null;
                if (!this.pSBCr) this.pSBCr = (d) => {
                    let n = d.length, x = {};
                    if (n > 9) {
                        [r, g, b, a] = d = d.split(","), n = d.length;
                        if (n < 3 || n > 4) return null;
                        x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4)), x.g = i(g), x.b = i(b), x.a = a ? parseFloat(a) : -1
                    } else {
                        if (n == 8 || n == 6 || n < 4) return null;
                        if (n < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : "");
                        d = i(d.slice(1), 16);
                        if (n == 9 || n == 5) x.r = d >> 24 & 255, x.g = d >> 16 & 255, x.b = d >> 8 & 255, x.a = m((d & 255) / 0.255) / 1000;
                        else x.r = d >> 16, x.g = d >> 8 & 255, x.b = d & 255, x.a = -1
                    } return x
                };
                h = fromColor.length > 9, h = a ? toColor.length > 9 ? true : toColor == "c" ? !h : false : h, f = pSBCr(fromColor), P = percent < 0, t = toColor && toColor != "c" ? pSBCr(toColor) : P ? { r: 0, g: 0, b: 0, a: -1 } : { r: 255, g: 255, b: 255, a: -1 }, percent = P ? percent * -1 : percent, P = 1 - percent;
                if (!f || !t) return null;
                if (linear) r = m(P * f.r + percent * t.r), g = m(P * f.g + percent * t.g), b = m(P * f.b + percent * t.b);
                else r = m((P * f.r ** 2 + percent * t.r ** 2) ** 0.5), g = m((P * f.g ** 2 + percent * t.g ** 2) ** 0.5), b = m((P * f.b ** 2 + percent * t.b ** 2) ** 0.5);
                a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * percent : 0;
                if (h) return "rgb" + (f ? "a(" : "(") + r + "," + g + "," + b + (f ? "," + m(a * 1000) / 1000 : "") + ")";
                else return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)
            },

            isSiteOnline: function (url, callback) {
                var timer = setTimeout(function () {
                    callback(false);
                }, 15000);

                var img = document.createElement("img");
                img.onload = function () {
                    clearTimeout(timer);
                    callback(true);
                }

                img.onerror = function () {
                    clearTimeout(timer);
                    callback(false);
                }

                img.src = url + "/favicon.ico";
            },

            convertDDToDDM: function (latitude, longitude) {
                return convertDDLatitudeToDDM(latitude) + ", " +
                    convertDDLongitudeToDDM(longitude);
            },

            convertDDLongitudeToDDM: function (longitude) {
                var lon = Number(longitude);
                var dir = (lon >= 0 ? 'E' : 'W');
                lon = Math.abs(lon);
                var d = Math.floor(lon);
                var m = ((lon - d) * 60).toFixed(4);
                return d + '° ' + m + '\' ' + dir;
            },

            convertDDLatitudeToDDM: function (latitude) {
                var lat = Number(latitude);
                var dir = (lat >= 0 ? 'N' : 'S');
                lat = Math.abs(lat);
                var d = Math.floor(lat);
                var m = ((lat - d) * 60).toFixed(4);
                return d + '° ' + m + '\' ' + dir;
            },

            convertDDToDMS: function (latitude, longitude) {
                return convertDDLatitudeToDMS(latitude) + ", " +
                    convertDDLongitudeToDMS(longitude);
            },

            convertDDLongitudeToDMS: function (longitude) {
                var lon = Number(longitude);
                var dir = (lon >= 0 ? 'E' : 'W');
                lon = Math.abs(lon);
                var d = Math.floor(lon);
                var m = Math.floor((lon - d) * 60);
                var s = ((lon - d - (m / 60)) * 3600).toFixed(2);
                return d + '° ' + m + '\' ' + s + '" ' + dir;
            },

            convertDDLatitudeToDMS: function (latitude) {
                var lat = Number(latitude);
                var dir = (lat >= 0 ? 'N' : 'S');
                lat = Math.abs(lat);
                var d = Math.floor(lat);
                var m = Math.floor((lat - d) * 60);
                var s = ((lat - d - (m / 60)) * 3600).toFixed(2);
                return d + '° ' + m + '\' ' + s + '" ' + dir;
            },

            convertDMSToDD: function (latitude, longitude) {
                return convertDMSLatitudeToDD(latitude) + ", " +
                    convertDMSLongitudeToDD(longitude);
            },

            convertDMSToDDM: function (latitude, longitude) {
                return convertDDLatitudeToDDM(convertDMSLatitudeToDD(latitude)) + ", " +
                    convertDDLongitudeToDDM(convertDMSLongitudeToDD(longitude))
            },

            convertDMSLongitudeToDD: function (longitude) {
                var dms = longitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = Number(dms[0]);
                if (d < 0) d = d * -1;

                var m = Number(dms[1]);
                var s = Number(dms[2].replace(/[EW]/gi, ""));

                var dir = "+";
                if (longitude.includes("-") || longitude.includes("W")) {
                    dir = "-";
                }

                var dm = m + (s / 60);
                var dd = ((dir === "-") ? -1 : 1) * (d + (dm / 60));
                return dd;
            },

            convertDMSLatitudeToDD: function (latitude) {
                var dms = latitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = Number(dms[0]);
                if (d < 0) d = d * -1;

                var m = Number(dms[1]);
                var s = Number(dms[2].replace(/[NS]/gi, ""));

                var dir = "+";
                if (latitude.includes("-") || latitude.includes("S")) {
                    dir = "-";
                }

                var dm = m + (s / 60);
                var dd = ((dir === "-") ? -1 : 1) * (d + (dm / 60));
                return dd;
            },

            convertDDMToDD: function (latitude, longitude) {
                return convertDDMLatitudeToDD(latitude) + ", " +
                    convertDDMLongitudeToDD(longitude);
            },

            convertDDMToDMS: function (latitude, longitude) {
                return convertDDLatitudeToDMS(convertDDMLatitudeToDD(latitude)) + ", " +
                    convertDDLongitudeToDMS(convertDDMLongitudeToDD(longitude))
            },

            convertDDMLongitudeToDD: function (longitude) {
                var ddm = longitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = Number(ddm[0]);
                if (d < 0) d = d * -1;

                var m = Number(ddm[1].replace(/[EW]/gi, ""));

                var dir = "+";
                if (longitude.includes("-") || longitude.includes("W")) {
                    dir = "-";
                }

                var dd = ((dir === "-") ? -1 : 1) * (d + (m / 60));
                return dd;
            },

            convertDDMLatitudeToDD: function (latitude) {
                var ddm = latitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = Number(ddm[0]);
                if (d < 0) d = d * -1;

                var m = Number(ddm[1].replace(/[NS]/gi, ""));

                var dir = "+";
                if (latitude.includes("-") || latitude.includes("S")) {
                    dir = "-";
                }

                var dd = ((dir === "-") ? -1 : 1) * (d + (m / 60));
                return dd;
            },

            /**
            * Convert data in CSV (comma separated value) format to a javascript array.
            *
            * Values are separated by a comma, or by a custom one character delimeter.
            * Rows are separated by a new-line character.
            *
            * Leading and trailing spaces and tabs are ignored.
            * Values may optionally be enclosed by double quotes.
            * Values containing a special character (comma's, double-quotes, or new-lines)
            *   must be enclosed by double-quotes.
            * Embedded double-quotes must be represented by a pair of consecutive 
            * double-quotes.
            *
            * Example usage:
            *   var csv = '"x", "y", "z"\n12.3, 2.3, 8.7\n4.5, 1.2, -5.6\n';
            *   var array = csv2array(csv);
            *  
            * Author: Jos de Jong, 2010
            * 
            * @param {string} data      The data in CSV format.
            * @param {string} delimeter [optional] a custom delimeter. Comma ',' by default
            *                           The Delimeter must be a single character.
            * @param {Boolean} isNumeric (if numeric, returns number array)
            * @return {Array} array     A two dimensional array containing the data
            * @throw {String} error     The method throws an error when there is an
            *                           error in the provided data.
            */
            csv2Array: function (data, delimeter, isNumeric) {
                // Retrieve the delimeter
                if (delimeter == undefined)
                    delimeter = ',';
                if (delimeter && delimeter.length > 1)
                    delimeter = ',';
                if (isNumeric == undefined)
                    isNumeric = false;

                // initialize variables
                var newline = '\n';
                var eof = '';
                var i = 0;
                var c = data.charAt(i);
                var row = 0;
                var col = 0;
                var array = new Array();

                while (c != eof) {
                    // skip whitespaces
                    while (c == ' ' || c == '\t' || c == '\r') {
                        c = data.charAt(++i); // read next char
                    }

                    // get value
                    var value = "";
                    if (c == '\"') {
                        // value enclosed by double-quotes
                        c = data.charAt(++i);

                        do {
                            if (c != '\"') {
                                // read a regular character and go to the next character
                                value += c;
                                c = data.charAt(++i);
                            }

                            if (c == '\"') {
                                // check for escaped double-quote
                                var cnext = data.charAt(i + 1);
                                if (cnext == '\"') {
                                    // this is an escaped double-quote. 
                                    // Add a double-quote to the value, and move two characters ahead.
                                    value += '\"';
                                    i += 2;
                                    c = data.charAt(i);
                                }
                            }
                        }
                        while (c != eof && c != '\"');

                        if (c == eof) {
                            throw "Unexpected end of data, double-quote expected";
                        }

                        c = data.charAt(++i);
                    }
                    else {
                        // value without quotes
                        while (c != eof && c != delimeter && c != newline && c != ' ' && c != '\t' && c != '\r') {
                            value += c;
                            c = data.charAt(++i);
                        }
                    }

                    // add the value to the array
                    if (array.length <= row) {
                        array.push(new Array());
                    }
                    array[row].push((isNumeric ? parseInt(value) : value));

                    // skip whitespaces
                    while (c == ' ' || c == '\t' || c == '\r') {
                        c = data.charAt(++i);
                    }

                    // go to the next row or column
                    if (c == delimeter) {
                        // to the next column
                        col++;
                    }
                    else if (c == newline) {
                        // to the next row
                        col = 0;
                        row++;
                    }
                    else if (c != eof) {
                        // unexpected character
                        throw "Delimiter expected after character " + i;
                    }

                    // go to the next character
                    c = data.charAt(++i);
                }

                return array;
            },

            zoomToLayer: function(map, layer) {
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