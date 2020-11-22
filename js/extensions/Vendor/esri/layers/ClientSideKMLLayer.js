/**
 * This software is the property of the U.S. Government.
 * Developed by ESRI for the United States Coast Guard 
 * under contract number 40024142.     
 *
 * KML placemark parser optimization, sequential index scan,
 * and style cache processing implemented by S.Dhaliwal USCG
 * 
 * @version 1.1.x
 *
 * @module cmwapi-adapter/vendor/esri/layers/ClientSideKMLLayer
 */
define(["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "esri/Color",
    "esri/graphic",
    "esri/SpatialReference",
    "esri/geometry/Point",
    "esri/geometry/Polyline",
    "esri/geometry/Polygon",
    "esri/layers/GraphicsLayer",
    "esri/InfoTemplate",
    "esri/dijit/Popup",
    "esri/dijit/PopupTemplate",
    "dojo/dom-construct",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/PictureFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/geometryEngine",
    "esri/layers/MapImageLayer",
    "esri/layers/MapImage",
    "app/extensions/JSUtils",
    "milsymbol"],
    function (declare, lang, array, on, Color, Graphic, SpatialReference, Point, Polyline, Polygon, GraphicsLayer, InfoTemplate, Popup, PopupTemplate, domConstruct,
        SimpleMarkerSymbol, PictureMarkerSymbol, PictureFillSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol, Font, webMercatorUtils, geometryEngine,
        MapImageLayer, MapImage, JSUtils, ms) {

        return declare([GraphicsLayer], {
            _setDefaultStypes: function () {
                this.defaultMarkerColor = "#504FB0DA";
                this.defaultLineWidth = 2;
                this.defaultLineColor = "#50000000";
                this.defaultLineStyle = SimpleLineSymbol.STYLE_SOLID;
                this.defaultFillColor = "#500F7CF8";
                this.defaultFillStyle = SimpleFillSymbol.STYLE_SOLID;
                this.defaultLineSymbol = new SimpleLineSymbol(this.defaultLineStyle,
                    this._getColor(this.defaultLineColor), this.defaultLineWidth).toJson();
                this.defaultPointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10,
                    new SimpleLineSymbol(this.defaultLineSymbol), this._getColor(this.defaultMarkerColor)).toJson();
                this.defaultFillSymbol = new SimpleFillSymbol(this.defaultFillStyle,
                    new SimpleLineSymbol(this.defaultLineSymbol), this._getColor(this.defaultFillColor)).toJson();
            },

            _getColor: function (color, opacity, colorMode) {
                if ((opacity === null) || (opacity === undefined)) {
                    if (this.properties && this.properties.opacity) {
                        opacity = this.properties.opacity * 255;
                    }
                } else {
                    opacity = opacity * 255;
                }

                if (color) {
                    var featureColor;

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
                            featureColor = JSUtils.getRandomColor(featureColor);
                        }
                        return featureColor;
                    }
                }

                return this._getColor(this.defaultFillColor);
            },

            _basemapMapFontColor: function (title) {
                var label = new TextSymbol();
                if (title.length > 20) {
                    label.setText(title.substring(0, 30) + "...");
                } else {
                    label.setText(title);
                }

                label.setAlign(TextSymbol.ALIGN_START);
                // adjust the font color based on 
                if ((map.basemapCurrentTitle === "Imagery") ||
                    (map.basemapCurrentTitle === "Imagery with Labels") ||
                    (map.basemapCurrentTitle === "Dark Gray Canvas")) {
                    label.setColor(this._getColor("#ffffff"));
                } else if ((map.basemapCurrentTitle === "Streets") ||
                    (map.basemapCurrentTitle === "Topographic") ||
                    (map.basemapCurrentTitle === "Light Gray Canvas") ||
                    (map.basemapCurrentTitle === "National Geographic") ||
                    (map.basemapCurrentTitle === "Terrain with Labels") ||
                    (map.basemapCurrentTitle === "Oceans") ||
                    (map.basemapCurrentTitle === "OpenStreetMaps") ||
                    (map.basemapCurrentTitle === "USA Topo Maps") ||
                    (map.basemapCurrentTitle === "USGS National Map")) {
                    label.setColor(this._getColor("#000000"));
                }

                return label;
            },
            _getNodeValues: function (node, elements, style) {
                for (var child of node.childNodes) {
                    if (elements.indexOf(child.nodeName) >= 0) {
                        var value = (child.innerText || child.text || child.textContent);

                        if (value.trim()) {
                            style[child.nodeName] = value.trim();
                        }
                        if (child.hasAttributes()) {
                            if (!style.hasOwnProperty("attributes")) {
                                style.attributes = {};
                            }

                            for (var attribute of child.attributes) {
                                style.attributes[child.nodeName + "." + attribute] = child.getAttribute(attribute);
                            }
                        }
                    }

                    if (child.hasChildNodes()) {
                        style = this._getNodeValues(child, elements, style);
                    }
                }

                return style;
            },
            _findStyleMap: function (url) {
                var styleMaps = this.styleMaps;
                var styleMap;

                //If we have a style map then search for the styleUrl in that map
                if (styleMaps && styleMaps.length > 0) {
                    for (var i = 0; i < styleMaps.length; i++) {
                        if ("#" + styleMaps[i].id === url) {
                            styleMap = styleMaps[i];
                            break;
                        }
                    }
                }

                return styleMap;
            },
            _getStyleMap: function (styleMapObject) {
                var styleMap = this._findStyleMap(styleMapObject.url);

                if (styleMap) {
                    //We have the styleUrl in the style map so we need to retrieve the styleUrl for the normal style
                    var pairs = styleMap.getElementsByTagName("Pair");
                    for (var j = 0; j < pairs.length; j++) {
                        pair = pairs[j];
                        key = pair.getElementsByTagName("key")[0];
                        url = pair.getElementsByTagName("styleUrl")[0];

                        if (key.textContent.trim() === "normal") {
                            styleMapObject.url = url.textContent.trim();
                        } else if (key.textContent.trim() === "highlight") {
                            styleMapObject.urlHighlighted = url.textContent.trim();
                            styleMapObject.hasHighlight = true;
                        }
                    }
                }

                return styleMapObject;
            },
            _findStyle: function (url) {
                var styles = this.styles;
                var style;

                if (styles && styles.length > 0) {
                    for (var x = 0; x < styles.length; x++) {
                        if ('#' + styles[x].id === url) {
                            style = styles[x];
                            break;
                        }
                    }
                }

                return style;
            },
            _createLabelSymbol: function (labelStyle, baseStyle, title) {
                var nodeElements = "color,scale,colorMode";

                var style = this._basemapMapFontColor(title);
                var styleObject = {
                    color: style.color
                };

                styleObject = this._getNodeValues(labelStyle[0], nodeElements, styleObject);
                var font = new Font();
                var size = 14;

                //if (baseStyle && baseStyle.color) {
                //    styleObject.color = baseStyle.color;
                //}

                if (styleObject.scale) {
                    size = size * styleObject.scale;
                    font.setSize(size);
                } else {
                    if (baseStyle && baseStyle.size) {
                        font.setSize(baseStyle.size);
                    } else {
                        font.setSize(size);
                    }
                }

                style.setFont(font);
                style.setColor(this._getColor(styleObject.color, null, styleObject.colorMode));
                return style;
            },
            _getLabelSymbol: function (graphic, title) {
                var styleUrl = graphic.getElementsByTagName("styleUrl");
                var styleMapObject = {
                    hasHighlight: false
                };
                var returnSymbols = {};

                //Process for StyleMap
                if (styleUrl && styleUrl.length > 0 && styleUrl[0].textContent.trim()) {
                    styleMapObject.url = styleUrl[0].textContent.trim();
                    this._getStyleMap(styleMapObject);

                    //Create the highlight symbol if needed
                    if (styleMapObject.hasHighlight) {
                        var style = this._findStyle(styleMapObject.urlHighlighted);
                        if (style) {
                            var labelStyle = style.getElementsByTagName("LabelStyle");
                            if (labelStyle && labelStyle.length > 0) {
                                if (!this.styleCache[styleMapObject.urlHighlighted + "_LabelStyle"]) {
                                    returnSymbols.highlighted = this._createLabelSymbol(labelStyle, null, title);

                                    this.styleCache[styleMapObject.urlHighlighted + "_LabelStyle"] = returnSymbols.highlighted;
                                } else {
                                    returnSymbols.highlighted = this.styleCache[styleMapObject.urlHighlighted + "_LabelStyle"];
                                }
                            } else {
                                styleMapObject.hasHighlight = false;
                            }
                        }
                    }

                    //Create the standard symbol if needed
                    style = this._findStyle(styleMapObject.url);
                    if (style) {
                        var labelStyle = style.getElementsByTagName("LabelStyle");
                        if (labelStyle && labelStyle.length > 0) {
                            if (!this.styleCache[styleMapObject.url + "_LabelStyle"]) {
                                returnSymbols.normal = this._createLabelSymbol(labelStyle, null, title);

                                this.styleCache[styleMapObject.url + "_LabelStyle"] = returnSymbols.normal;
                            } else {
                                returnSymbols.normal = this.styleCache[styleMapObject.url + "_LabelStyle"];
                            }
                        }
                    }
                }

                //Process for local style
                var style = graphic.getElementsByTagName("Style");
                if (style && style.length > 0) {
                    var labelStyle = style[0].getElementsByTagName("LabelStyle");
                    if (labelStyle && labelStyle.length > 0) {
                        returnSymbols.normal = this._createLabelSymbol(labelStyle, returnSymbols.normal, title);
                    }
                }

                //If no style is specified use the default symbol
                if (!returnSymbols.normal) {
                    var basemapLabelStyle = this._basemapMapFontColor(title);

                    var font = new Font();
                    var size = 14;

                    font.setSize(size);
                    basemapLabelStyle.setFont(font);

                    returnSymbols.normal = basemapLabelStyle;
                }

                //If no style is specified for highlighted use the default symbol
                if (!styleMapObject.hasHighlight) {
                    returnSymbols.highlighted = returnSymbols.normal;
                }

                // since we have to change the title of the label; we need to clone both states
                returnSymbols.normal = new TextSymbol(returnSymbols.normal.toJson());
                returnSymbols.normal.setText(title);
                returnSymbols.highlighted = new TextSymbol(returnSymbols.highlighted.toJson());
                returnSymbols.highlighted.setText(title);

                return returnSymbols;
            },
            _createIconSymbol: function (iconStyle, baseStyle) {
                var nodeElements = "href,color,scale,heading,hotspot,colorMode";

                var style;
                var styleObject = this._getNodeValues(iconStyle[0], nodeElements, {});

                if (styleObject.href || (baseStyle && baseStyle.url)) {
                    style = new PictureMarkerSymbol();

                    if (baseStyle) {
                        style.angle = baseStyle.angle;
                        style.color = baseStyle.color;
                        //style.height = baseStyle.height;
                        //style.type = baseStyle.type;
                        style.url = baseStyle.url;
                        //style.width = baseStyle.width;
                        style.xoffset = baseStyle.xoffset;
                        style.xoffset = baseStyle.xoffset;
                    }

                    let hrefUrl = styleObject.href || style.url;
                    if (hrefUrl.startsWith("milstd:")) {
                        let milstdSymbol = new ms.Symbol(hrefUrl.split(":")[1]);
                        style.setUrl(milstdSymbol.toDataURL());
                    } else {
                        style.setUrl(hrefUrl);
                    }
                    if (styleObject.color) {
                        style.setColor(this._getColor(styleObject.color, null, styleObject.colorMode));
                    }
                    if (styleObject.scale) {
                        var size = style.width * styleObject.scale;
                        style.setHeight(size);
                        style.setWidth(size);
                    } else {
                        if (baseStyle) {
                            style.height = baseStyle.height;
                            style.width = baseStyle.width;
                        }    
                    }
                    if (styleObject.heading) {
                        var angle = styleObject.heading;
                        style.setAngle(angle);
                    }
                } else if (styleObject.color || styleObject.colorMode) {
                    style = new SimpleMarkerSymbol();

                    if (baseStyle) {
                        style.angle = baseStyle.angle;
                        style.color = baseStyle.color;
                        //style.type = baseStyle.type;
                        style.size = baseStyle.size;
                        //style.style = baseStyle.style;
                        style.xoffset = baseStyle.xoffset;
                        style.xoffset = baseStyle.xoffset;
                    }

                    if (!styleObject.color) {
                        styleObject.color = style.color;
                    }
                    style.setColor(this._getColor(styleObject.color, null, styleObject.colorMode));
                    if (styleObject.scale) {
                        var size = 10 * styleObject.scale;
                        style.setSize(size);
                    }
                } 

                return style;
            },
            _getIconSymbol: function (graphic) {
                var styleUrl = graphic.getElementsByTagName("styleUrl");
                var styleMapObject = {
                    hasHighlight: false
                };
                var returnSymbols = {};

                //Process for StyleMap/StyleUrl
                if (styleUrl && styleUrl.length > 0 && styleUrl[0].textContent.trim()) {
                    styleMapObject.url = styleUrl[0].textContent.trim();
                    this._getStyleMap(styleMapObject);

                    //Create the highlight symbol if needed
                    if (styleMapObject.hasHighlight) {
                        var style = this._findStyle(styleMapObject.urlHighlighted);
                        if (style) {
                            var iconStyle = style.getElementsByTagName("IconStyle");
                            if (iconStyle && iconStyle.length > 0) {
                                if (!this.styleCache[styleMapObject.urlHighlighted + "_IconStyle"]) {
                                    returnSymbols.highlighted = this._createIconSymbol(iconStyle);
                                    this.styleCache[styleMapObject.urlHighlighted + "_IconStyle"] = returnSymbols.highlighted;
                                } else {
                                    returnSymbols.highlighted = this.styleCache[styleMapObject.urlHighlighted + "_IconStyle"];
                                }
                            } else {
                                styleMapObject.hasHighlight = false;
                            }
                        }
                    }

                    //Create the standard symbol if needed
                    style = this._findStyle(styleMapObject.url);
                    if (style) {
                        var iconStyle = style.getElementsByTagName("IconStyle");
                        if (iconStyle && iconStyle.length > 0) {
                            if (!this.styleCache[styleMapObject.url + "_IconStyle"]) {
                                returnSymbols.normal = this._createIconSymbol(iconStyle);
                                this.styleCache[styleMapObject.url + "_IconStyle"] = returnSymbols.normal;
                            } else {
                                returnSymbols.normal = this.styleCache[styleMapObject.url + "_IconStyle"];
                            }
                        }
                    }
                }

                //Process for local placemark style
                var style = graphic.getElementsByTagName("Style");
                if (style && style.length > 0) {
                    var iconStyle = style[0].getElementsByTagName("IconStyle");
                    if (iconStyle && iconStyle.length > 0) {
                        returnSymbols.normal = this._createIconSymbol(iconStyle, returnSymbols.normal);
                    }

                    // if there is a highlight symbol, then we need to clone and update
                    if (returnSymbols.highlighted) {
                        returnSymbols.highlighted = this._createIconSymbol(iconStyle, returnSymbols.highlighted);
                    }
                }

                //If no style is specified for normal use the default symbol
                if (!returnSymbols.normal) {
                    returnSymbols.normal = new SimpleMarkerSymbol(this.defaultPointSymbol);
                }

                //If no style is specified for highlighed use the normal symbol
                if (!styleMapObject.hasHighlight) {
                    returnSymbols.highlighted = returnSymbols.normal;
                }
                return returnSymbols;
            },
            _createLineSymbol: function (lineStyle, baseStyle) {
                var nodeElements = "color,width,colorMode";

                var lineWidth = this.defaultLineWidth;
                if (baseStyle && baseStyle.width) {
                    lineWidth = baseStyle.width;
                }

                var lineColor = this.defaultLineColor;
                if (baseStyle && baseStyle.color) {
                    lineColor = baseStyle.color;
                }

                var styleObject = this._getNodeValues(lineStyle[0], nodeElements,
                    { color: lineColor, width: lineWidth });

                return new SimpleLineSymbol(this.defaultLineStyle,
                    this._getColor(styleObject.color, null, styleObject.colorMode), styleObject.width);
            },
            _getLineSymbol: function (graphic) {
                var styleUrl = graphic.getElementsByTagName("styleUrl");
                var styleMapObject = {
                    hasHighlight: false
                };
                var returnSymbols = {};

                //Process for StyleMap
                if (styleUrl && styleUrl.length > 0 && styleUrl[0].textContent.trim()) {
                    styleMapObject.url = styleUrl[0].textContent.trim();
                    this._getStyleMap(styleMapObject);

                    //Create the highlight symbol if needed
                    if (styleMapObject.hasHighlight) {
                        var style = this._findStyle(styleMapObject.urlHighlighted);
                        if (style) {
                            var lineStyle = style.getElementsByTagName("LineStyle");
                            if (lineStyle && lineStyle.length > 0) {
                                if (!this.styleCache[styleMapObject.urlHighlighted + "_LineStyle"]) {
                                    returnSymbols.highlighted = this._createLineSymbol(lineStyle);

                                    this.styleCache[styleMapObject.urlHighlighted + "_LineStyle"] = returnSymbols.highlighted;
                                } else {
                                    returnSymbols.highlighted = this.styleCache[styleMapObject.urlHighlighted + "_LineStyle"];
                                }
                            } else {
                                styleMapObject.hasHighlight = false;
                            }
                        }
                    }

                    //Create the standard symbol if needed
                    style = this._findStyle(styleMapObject.url);
                    if (style) {
                        var lineStyle = style.getElementsByTagName("LineStyle");
                        if (lineStyle && lineStyle.length > 0) {
                            if (!this.styleCache[styleMapObject.url + "_LineStyle"]) {
                                returnSymbols.normal = this._createLineSymbol(lineStyle);

                                this.styleCache[styleMapObject.url + "_LineStyle"] = returnSymbols.normal;
                            } else {
                                returnSymbols.normal = this.styleCache[styleMapObject.url + "_LineStyle"];
                            }
                        }
                    }
                }

                //Process for local style
                var style = graphic.getElementsByTagName("Style");
                if (style && style.length > 0) {
                    var lineStyle = style[0].getElementsByTagName("LineStyle");
                    if (lineStyle && lineStyle.length > 0) {
                        returnSymbols.normal = this._createLineSymbol(lineStyle, returnSymbols.normal);
                    }
                }

                //If no style is specified use the default symbol
                if (!returnSymbols.normal) {
                    returnSymbols.normal = new SimpleLineSymbol(this.defaultLineSymbol);
                }

                //If no style is specified for highlighted use the default symbol
                if (!styleMapObject.hasHighlight) {
                    returnSymbols.highlighted = returnSymbols.normal;
                }
                return returnSymbols;
            },
            _createPolygonSymbol: function (polyStyle, baseStyle, baseLineStyle) {
                var nodeElements = "color,fill,outline,colorMode";

                var fillColor = this.defaultFillColor;
                if (baseStyle && baseStyle.color) {
                    fillColor = baseStyle.OriginalFillColor;
                }

                var styleObject = this._getNodeValues(polyStyle[0], nodeElements,
                    { color: fillColor });

                var style = new SimpleFillSymbol();
                style.OriginalFillColor = styleObject.color;

                // fill is set to false so remove the fill color by setting it to transparent
                var opacity;
                if (styleObject.fill && !JSUtils.getBoolean(styleObject.fill)) {
                    opacity = 0;
                }
                style.setColor(this._getColor(styleObject.color, opacity, styleObject.colorMode));

                var outline = new SimpleLineSymbol(this.defaultLineStyle, this._getColor(baseLineStyle.color, null, styleObject.colorMode), baseLineStyle.width);
                if (styleObject.outline && !JSUtils.getBoolean(styleObject.outline)) {
                    outline.setColor(this._getColor(this.defaultLineColor, 0));
                }
                style.setOutline(outline);

                return style;
            },
            _getPolygonSymbol: function (graphic) {
                var styleUrl = graphic.getElementsByTagName("styleUrl");
                var styleMapObject = {
                    hasHighlight: false
                };
                var returnSymbols = {};
                var lineStyle = this._getLineSymbol(graphic);
                var lineStyleHighlighted = lineStyle.highlighted.toJson();
                var lineStyleNormal = lineStyle.normal.toJson();

                //Process for StyleMap
                if (styleUrl && styleUrl.length > 0 && styleUrl[0].textContent.trim()) {
                    styleMapObject.url = styleUrl[0].textContent.trim();
                    this._getStyleMap(styleMapObject);

                    //Create the highlight symbol if needed
                    if (styleMapObject.hasHighlight) {
                        var style = this._findStyle(styleMapObject.urlHighlighted);
                        if (style) {
                            var polyStyle = style.getElementsByTagName("PolyStyle");
                            if (polyStyle && polyStyle.length > 0) {
                                if (!this.styleCache[styleMapObject.urlHighlighted + "_PolyStyle"]) {
                                    returnSymbols.highlighted = this._createPolygonSymbol(polyStyle, null, lineStyleHighlighted);
                                    this.styleCache[styleMapObject.urlHighlighted + "_PolyStyle"] = returnSymbols.highlighted;
                                } else {
                                    returnSymbols.highlighted = this.styleCache[styleMapObject.urlHighlighted + "_PolyStyle"];
                                }
                            } else {
                                styleMapObject.hasHighlight = false;
                            }
                        }
                    }

                    //Create the standard symbol if needed
                    style = this._findStyle(styleMapObject.url);
                    if (style) {
                        var polyStyle = style.getElementsByTagName("PolyStyle");
                        if (polyStyle && polyStyle.length > 0) {
                            if (!this.styleCache[styleMapObject.url + "_PolyStyle"]) {
                                returnSymbols.normal = this._createPolygonSymbol(polyStyle, null, lineStyleNormal);
                                this.styleCache[styleMapObject.url + "_PolyStyle"] = returnSymbols.normal;
                            } else {
                                returnSymbols.normal = this.styleCache[styleMapObject.url + "_PolyStyle"];
                            }
                        }
                    }
                }

                //Process for local style
                var style = graphic.getElementsByTagName("Style");
                if (style && style.length > 0) {
                    var polyStyle = style[0].getElementsByTagName("PolyStyle");
                    if (polyStyle && polyStyle.length > 0) {
                        returnSymbols.normal = this._createPolygonSymbol(polyStyle, returnSymbols.normal, lineStyleNormal);
                    }
                }

                //If no style is specified for normal use the default symbol
                if (!returnSymbols.normal) {
                    returnSymbols.normal = new SimpleFillSymbol(this.defaultFillSymbol);

                    // add the outline from lineStyle if provided
                    var outline = new SimpleLineSymbol(this.defaultLineStyle, this._getColor(lineStyleNormal.color, null, "random"),
                        lineStyleNormal.width);
                    returnSymbols.normal.setOutline(outline);
                }

                //If no style is specified for highlight use the default symbol
                if (!styleMapObject.hasHighlight) {
                    returnSymbols.highlighted = returnSymbols.normal;
                }
                return returnSymbols;
            },
            _processPoints: function (pointsDom, symbols, attributes) {
                array.forEach(pointsDom, lang.hitch(this, function (point) {
                    var coordinates = point.getElementsByTagName("coordinates");
                    if (coordinates && coordinates.length > 0) {
                        var coords = coordinates[0].textContent.replace(/\s+/g, ' ').replace(/, /g, ',').split(",");
                        if (coords.length > 1) {
                            var pt = new Point(coords[0], coords[1], new SpatialReference({
                                wkid: 4326
                            }));

                            var newPopupTemplate = null;
                            if (!this.popupTemplate.content) {
                                newPopupTemplate = new InfoTemplate();
                                newPopupTemplate.setTitle("${Name}");
                                var description = attributes.Description ? (attributes.Description + "<hr>") : "";
                                description +=
                                    "<div class=\"esriViewPopup\"><div class=\"mainSection\"><table class=\"attrTable\" cellpadding=\"2px\" cellspacing=\"0px\"> " +
                                    "<tbody> ";
                                for (var field in attributes) {
                                    if (field !== "Description") {
                                        description += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" + attributes[field] + "</td></tr> ";
                                    }
                                };
                                description +=
                                    "</tbody> " +
                                    "</table></div></div>";
                                newPopupTemplate.setContent(description);
                            } else {
                                newPopupTemplate = new InfoTemplate(attributes.name, this.popupTemplate.content);
                            }

                            var graphic = new Graphic(pt, symbols.normal, attributes, newPopupTemplate);
                            graphic.normalSymbol = symbols.normal;
                            graphic.highlightSymbol = symbols.highlighted;
                            // graphic.setSymbol(symbol);                          
                            this.add(graphic);

                            //Add Label
                            if (this.showLabels && JSUtils.getBoolean(this.showLabels)) {
                                //this._createLabel(pt, attributes.name);
                                // temp fix for label offset
                                symbols.labelSymbol.normal.xoffset = 13;
                                symbols.labelSymbol.normal.yoffset = 0;

                                var labelGraphic = new Graphic(pt, symbols.labelSymbol.normal);
                                labelGraphic.normalSymbol = symbols.labelSymbol.normal;
                                labelGraphic.highlightSymbol = symbols.labelSymbol.highlighted;

                                graphic.labelGraphic = labelGraphic;
                                this.labelLayer.add(labelGraphic);
                            }

                            if (this._updateSupported) {
                                this.markerIndex[attributes.id].graphic.push(graphic);
                            }
                        }
                    }
                }));
            },
            _createRingBasedGraphic: function (ringGeomArr, callback) {
                array.forEach(ringGeomArr, lang.hitch(this, function (ringGeom) {
                    var coordinates = ringGeom.getElementsByTagName("coordinates");
                    if (coordinates && coordinates.length > 0) {
                        var rings = [];
                        array.forEach(coordinates, lang.hitch(this, function (coordinate) {
                            var iRings = [], pRings = [];
                            var coordinatesArray = coordinate.textContent.replace(/\s+/g, ' ').replace(/, /g, ',').split(' ');
                            coordinatesArray.forEach(lang.hitch(this, function (pCoordinates) {
                                pCoordinates = pCoordinates.split(',');

                                pRings.push([pCoordinates[0], pCoordinates[1]]);
                            }));

                            // fix rings due to spaces
                            for (var i = 0; i < pRings.length; i++) {
                                if (pRings[i][1] !== undefined) {
                                    if (pRings[i][1] !== "") {
                                        iRings.push(pRings[i]);
                                    } else if (pRings[i][1] === "") {
                                        iRings.push([pRings[i][0], pRings[i + 1][0]]);
                                        i++;
                                    }
                                }
                            }

                            rings.push(iRings);
                        }));

                        callback(rings);
                    }
                }));
            },
            _processLines: function (linesDom, symbols, attributes) {
                this._createRingBasedGraphic(linesDom, lang.hitch(this, function (rings) {
                    var polyline = new Polyline({
                        "paths": rings,
                        "spatialReference": {
                            "wkid": 4326
                        }
                    });

                    var newPopupTemplate = null;
                    if (!this.popupTemplate.content) {
                        newPopupTemplate = new InfoTemplate();
                        newPopupTemplate.setTitle("${Name}");
                        var description = attributes.Description ? (attributes.Description + "<hr>") : "";
                        description +=
                            "<div class=\"esriViewPopup\"><div class=\"mainSection\"><table class=\"attrTable\" cellpadding=\"2px\" cellspacing=\"0px\"> " +
                            "<tbody> ";
                        for (var field in attributes) {
                            if (field !== "Description") {
                                description += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" + attributes[field] + "</td></tr> ";
                            }
                        };
                        description +=
                            "</tbody> " +
                            "</table></div></div>";
                        newPopupTemplate.setContent(description);
                    } else {
                        newPopupTemplate = new InfoTemplate(attributes.name, this.popupTemplate.content);
                    }

                    var graphic = new Graphic(polyline, symbols.normal, attributes, newPopupTemplate);
                    graphic.normalSymbol = symbols.normal;
                    graphic.highlightSymbol = symbols.highlighted;
                    this.add(graphic);

                    if (this.showLabels && JSUtils.getBoolean(this.showLabels)) {
                        //this._createLabel(pt, attributes.name);
                        pt = graphic._extent.getCenter();

                        var labelGraphic = new Graphic(pt, symbols.labelSymbol.normal);
                        labelGraphic.normalSymbol = symbols.labelSymbol.normal;
                        labelGraphic.highlightSymbol = symbols.labelSymbol.highlighted;

                        graphic.labelGraphic = labelGraphic;
                        this.labelLayer.add(labelGraphic);
                    }

                    if (this._updateSupported) {
                        this.markerIndex[attributes.id].graphic.push(graphic);
                    }
                }));
            },
            _processPolygons: function (polygonsDom, symbols, attributes) {
                this._createRingBasedGraphic(polygonsDom, lang.hitch(this, function (rings) {
                    var polygon = new Polygon({
                        "rings": rings,
                        "spatialReference": {
                            "wkid": 4326
                        }
                    });

                    var newPopupTemplate = null;
                    if (!this.popupTemplate.content) {
                        newPopupTemplate = new InfoTemplate();
                        newPopupTemplate.setTitle("${Name}");
                        var description = attributes.Description ? (attributes.Description + "<hr>") : "";
                        description +=
                            "<div class=\"esriViewPopup\"><div class=\"mainSection\"><table class=\"attrTable\" cellpadding=\"2px\" cellspacing=\"0px\"> " +
                            "<tbody> ";
                        for (var field in attributes) {
                            if (field !== "Description") {
                                description += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" + attributes[field] + "</td></tr> ";
                            }
                        };
                        description +=
                            "</tbody> " +
                            "</table></div></div>";
                        newPopupTemplate.setContent(description);
                    } else {
                        newPopupTemplate = new InfoTemplate(attributes.name, this.popupTemplate.content);
                    }

                    var graphic = new Graphic(polygon, symbols.normal, attributes, newPopupTemplate);
                    graphic.normalSymbol = symbols.normal;
                    graphic.highlightSymbol = symbols.highlighted;
                    this.add(graphic);

                    if (this.showLabels && JSUtils.getBoolean(this.showLabels)) {
                        //this._createLabel(pt, attributes.name);
                        pt = graphic._extent.getCenter();

                        var labelGraphic = new Graphic(pt, symbols.labelSymbol.normal);
                        labelGraphic.normalSymbol = symbols.labelSymbol.normal;
                        labelGraphic.highlightSymbol = symbols.labelSymbol.highlighted;

                        graphic.labelGraphic = labelGraphic;
                        this.labelLayer.add(labelGraphic);
                    }

                    if (this._updateSupported) {
                        this.markerIndex[attributes.id].graphic.push(graphic);
                    }
                }));
            },
            _processPlacemark: function (placemarkDom, attributes, parentDom) {
                var attributes = attributes || {};
                var descriptions = (parentDom || placemarkDom).getElementsByTagName("description");
                if (descriptions && descriptions.length > 0) {
                    attributes["Description"] = descriptions[0].textContent.trim();
                }
                var names = (parentDom || placemarkDom).getElementsByTagName("name");
                if (names && names.length > 0) {
                    attributes["name"] = names[0].textContent.trim();
                }
                if (!attributes.name) {
                    attributes.name = (attributes.id || "");
                }
                // process extended data
                var extData = (parentDom || placemarkDom).getElementsByTagName("ExtendedData");
                if (extData && extData.length > 0) {
                    extDataData = extData[0].getElementsByTagName("Data");
                    array.forEach(extDataData, lang.hitch(this, function (data) {
                        if (data.getElementsByTagName("value")[0] !== undefined) {
                            let value = data.getElementsByTagName("value")[0].textContent.trim();
                            if (typeof value === "string") {
                                if (value.includes("%3A") || value.includes("%2F") || value.includes("%25") || value.includes("%3D") || value.includes("%3F") || value.includes("%26")) {
                                    value = decodeURIComponent(value.replace(/\"/g, ""));
                                }
                            }

                            attributes[data.getAttribute("name")] = value;
                        }
                    }));
                    extDataSimpleData = extData[0].getElementsByTagName("SimpleData");
                    array.forEach(extDataSimpleData, lang.hitch(this, function (data) {
                        if (data.textContent !== undefined) {
                            let value = data.textContent.trim();
                            if (typeof value === "string") {
                                if (value.includes("%3A") || value.includes("%2F") || value.includes("%25") || value.includes("%3D") || value.includes("%3F") || value.includes("%26")) {
                                    value = decodeURIComponent(value.replace(/\"/g, ""));
                                }
                            }

                            attributes[data.getAttribute("name")] = value;
                        }
                    }));
                }

                var geometryType = placemarkDom.getElementsByTagName("MultiGeometry");
                if (geometryType && geometryType.length > 0) {
                    var multiGeometries = geometryType;
                    for (var i = 0; i < multiGeometries.length; i++) {
                        this._processPlacemark(multiGeometries[i], attributes, placemarkDom);
                    }
                }

                if (this.updateAction === "initial") {
                    if ((!attributes.hasOwnProperty("id") || (!this._updateSupported))) {
                        this._updateSupported = false;
                        attributes.id = this._markers++;
                    }
                } else {
                    if (this._updateSupported && (!attributes.hasOwnProperty("id"))) {    
                        console.log("layer supports updates, placemark.id is required!");
                        return;
                    }
                }

                geometryType = placemarkDom.getElementsByTagName("Point");
                if (geometryType && geometryType.length > 0) {
                    var iconSymbols = this._getIconSymbol((parentDom || placemarkDom));
                    var labelSymbols = this._getLabelSymbol((parentDom || placemarkDom), attributes.name);
                    iconSymbols.labelSymbol = labelSymbols;
                    this._processPoints(geometryType, iconSymbols, attributes);
                }

                geometryType = placemarkDom.getElementsByTagName("LineString");
                if (geometryType && geometryType.length > 0) {
                    var lineSymbols = this._getLineSymbol((parentDom || placemarkDom));
                    var labelSymbols = this._getLabelSymbol((parentDom || placemarkDom), attributes.name);
                    lineSymbols.labelSymbol = labelSymbols;
                    this._processLines(geometryType, lineSymbols, attributes);
                }

                geometryType = placemarkDom.getElementsByTagName("Polygon");
                if (geometryType && geometryType.length > 0) {
                    var polygonSymbols = this._getPolygonSymbol((parentDom || placemarkDom));
                    var labelSymbols = this._getLabelSymbol((parentDom || placemarkDom), attributes.name);
                    polygonSymbols.labelSymbol = labelSymbols;
                    this._processPolygons(geometryType, polygonSymbols, attributes);
                }
            },

            _processGroundOverlay: function (groundOverlayDom) {
                var latlonbox = groundOverlayDom.getElementsByTagName("LatLonBox");
                var xmin = 0;
                var xmax = 1;
                var ymin = 0;
                var ymax = 1;

                if (latlonbox && latlonbox.length > 0) {
                    xmin = latlonbox[0].getElementsByTagName("west")[0].textContent.trim();
                    xmax = latlonbox[0].getElementsByTagName("east")[0].textContent.trim();
                    ymin = latlonbox[0].getElementsByTagName("south")[0].textContent.trim();
                    ymax = latlonbox[0].getElementsByTagName("north")[0].textContent.trim();
                }
                var href = groundOverlayDom.getElementsByTagName("href")[0].textContent.trim();

                var mapImage = new esri.layers.MapImage({
                    'extent': {
                        'xmin': xmin,
                        'ymin': ymin,
                        'xmax': xmax,
                        'ymax': ymax
                    },
                    'href': href
                });

                this.mapImageLayer.addImage(mapImage);
                map.addLayer(this.mapImageLayer);
            },

            _parseKml: function (kmlString) {
                if (kmlString !== undefined) {
                    this.kmlString = kmlString;
                }

                this.kmlDom = null;
                if (window.DOMParser) {
                    this.kmlDom = (new DOMParser()).parseFromString(this.kmlString, "text/xml");
                } else if (window.ActiveXObject) {
                    this.kmlDom = new ActiveXObject('Microsoft.XMLDOM');
                    this.kmlDom.async = false;
                    if (!this.kmlDom.loadXML(this.kmlString)) {
                        throw this.kmlDom.parseError.reason + " " + this.kmlDom.parseError.srcText;
                    }
                } else {
                    throw "Unable to parse KML string.";
                }

                // log error in dom (alert user)
                var domError = this.kmlDom.getElementsByTagName("parsererror");
                if (domError && domError.length > 0) {
                    console.log("xml/kml parsing error/", kmlString);
                    $.notify(domError[0].textContent.trim(), {
                        className: "error",
                        // autoHide: true,
                        // autoHideDelay: 10000
                        clickToHide: true
                    });
                }

                // create master cache for dom global objects
                if ((this.updateAction === undefined) || (this.updateAction === "initial") ||
                    (this.styleMaps === undefined) || (this.styles === undefined)) {
                    this.styleMaps = this.kmlDom.getElementsByTagName("StyleMap");
                    this.styles = this.kmlDom.getElementsByTagName("Style");
                }

                // process dom feature/geometry objects
                var placemarks = this.kmlDom.getElementsByTagName("Placemark");
                var groundOverlays = this.kmlDom.getElementsByTagName("GroundOverlay");

                var balloonStyles = this.kmlDom.getElementsByTagName("BalloonStyle");
                if (balloonStyles && balloonStyles.length > 0) {
                    this.balloonStyle = balloonStyles[0];
                }

                for (var i = 0; i < placemarks.length; i++) {
                    var attributes = {};
                    var placemarkDom = placemarks[i];
                    
                    if (placemarkDom.attributes && placemarkDom.attributes.id) {
                        attributes["id"] = placemarkDom.attributes.id.nodeValue;
                    } else if (placemarkDom.getElementsByTagName("id")) {
                        var fIdTemp = placemarkDom.getElementsByTagName("id");
                        if (fIdTemp && fIdTemp.length > 0) {
                            attributes["id"] = fIdTemp[0].textContent.trim();
                        }
                    }

                    if (this._updateSupported && (attributes.hasOwnProperty("id")) &&
                        ((attributes.id !== undefined) || (attributes.id !== null) || (attributes.id !== ""))) {
                        if (!this.markerIndex.hasOwnProperty(attributes.id)) {
                            this.markerIndex[attributes.id] = {
                                graphic: []
                            }
                        } else {
                            if ((this.markerIndex[attributes.id] !== undefined) && (this.markerIndex[attributes.id].graphic !== undefined)) {
                                array.forEach(this.markerIndex[attributes.id].graphic, lang.hitch(this, function (itemGraphic) {
                                    delete itemGraphic.normalSymbol;
                                    delete itemGraphic.highlightSymbol;
                                    delete itemGraphic.attributes;
                                    delete itemGraphic.geometry;
                                    delete itemGraphic.symbol;
                                    delete itemGraphic.infoTemplate;
                                    
                                    if (itemGraphic.hasOwnProperty("labelGraphic")) {
                                        this.labelLayer.remove(itemGraphic.labelGraphic);

                                        delete itemGraphic.labelGraphic;
                                        delete itemGraphic.labelGraphic.normalSymbol;
                                        delete itemGraphic.labelGraphic.highlightSymbol;
                                    }
                                    
                                    this.remove(itemGraphic);
                                }));
    
                                this.markerIndex[attributes.id].graphic = [];
                            }
                        }
                    } else {
                        this._updateSupported = false;
                    }
    
                    this._processPlacemark(placemarks[i], attributes);
                }

                if (groundOverlays.length) {
                    this.mapImageLayer = new esri.layers.MapImageLayer();
                    this.hasMapImageLayer = true;
                } else {
                    this.hasMapImageLayer = false;
                }

                for (var i = 0; i < groundOverlays.length; i++) {
                    this._processGroundOverlay(groundOverlays[i]);
                }
            },

            mOverGraphic: function (evt) {
                evt.graphic.setSymbol(evt.graphic.highlightSymbol);
                if (evt.graphic.labelGraphic) {
                    evt.graphic.labelGraphic.setSymbol(evt.graphic.labelGraphic.highlightSymbol);
                }
            },

            mOutGraphic: function (evt) {
                evt.graphic.setSymbol(evt.graphic.normalSymbol);
                if (evt.graphic.labelGraphic) {
                    evt.graphic.labelGraphic.setSymbol(evt.graphic.labelGraphic.normalSymbol);
                }
            },

            updateLayer: function(features) {
                if (this._updateSupported) {
                    if (features.add !== undefined) {
                        this.updateAction = "add";
                        this._parseKml(features.add);
                    }
                    if (features.update !== undefined) {
                        this.updateAction = "update";
                        this._parseKml(features.update);
                    }
                    if (features.remove !== undefined) {
                        this.updateAction = "remove";
                        
                        array.forEach(features.remove, lang.hitch(this, function (item) {
                            if ((this.markerIndex[item.id] !== undefined) && (this.markerIndex[item.id].graphic !== undefined)) {
                                array.forEach(this.markerIndex[item.id].graphic, lang.hitch(this, function (itemGraphic) {
                                    delete itemGraphic.normalSymbol;
                                    delete itemGraphic.highlightSymbol;
                                    delete itemGraphic.attributes;
                                    delete itemGraphic.geometry;
                                    delete itemGraphic.symbol;
                                    delete itemGraphic.infoTemplate;
    
                                    if (itemGraphic.hasOwnProperty("labelGraphic")) {
                                        this.labelLayer.remove(itemGraphic.labelGraphic);

                                        delete itemGraphic.labelGraphic;
                                        delete itemGraphic.labelGraphic.normalSymbol;
                                        delete itemGraphic.labelGraphic.highlightSymbol;
                                    }

                                    this.remove(itemGraphic);
                                }));
                            }

                            delete this.markerIndex[item.id];
                        }));
                    }

                    // cleanup extra items
                    delete this.kmlDom;
                    delete this.kmlString;
                    delete this._params.kmlString;
                } else {
                    console.log("layer update not supported!");
                }
            },

            constructor: function (args) {
                if (args.featureLayer !== undefined) {
                    Object.assign(this, args.featureLayer);

                    this.updateLayer(args.featureUpdates);
                    return;
                }

                declare.safeMixin(this, args);

                this._setDefaultStypes();
                // adjust for backward compatibility
                this.showLabels = JSUtils.getBoolean(this.showLabels || this.properties.showLabels || false);
                if (this.properties.hasOwnProperty("labels")) {
                    this.showLabels = JSUtils.getBoolean(this.showLabels || this.properties.labels.visible || false);
                }

                this.updateAction = "initial";
                this._updateSupported = true;
                this._markers = 0;
                this.styleCache = {};
                this.markerIndex = {};

                this.labelLayer = new GraphicsLayer();
                map.addLayer(this.labelLayer);
                this.labelLayerId = this.labelLayer.id;

                // handle updates if sent incorrectly
                var localKmlString = this.kmlString;
                if ((localKmlString.add !== undefined) || (localKmlString.update !== undefined) ||
                    (localKmlString.remove !== undefined)) {
                    this.updateLayer(this.kmlString);
                } else this._parseKml();
                this.map = map;

                on(this, "mouse-over", lang.hitch(this, function (evt) {
                    this.mOverGraphic(evt);
                }));
                on(this, "mouse-out", lang.hitch(this, function (evt) {
                    this.mOutGraphic(evt);
                }));

                //Set visibility of label layer when graphics layer visibility is changed.
                on(this, "visibility-change", lang.hitch(this, function (evt) {
                    if (evt.visible) {
                        id = this.labelLayer.id;
                        this.map.getLayer(id).show();
                    }
                    else {
                        id = this.labelLayer.id;
                        this.map.getLayer(id).hide();
                    }
                }));

                // If the graphics layer is removed then remove the label layer. 
                on(this.map, "layer-remove", lang.hitch(this, function (evt) {
                    if (evt.layer.id == this.id) {
                        this.map.removeLayer(this.labelLayer);
                    }

                    //this.map.infoWindow.hide();
                }));

                // cleanup extra items
                delete this.kmlDom;
                delete this.kmlString;
                delete this._params.kmlString;
            }
        });
    });
