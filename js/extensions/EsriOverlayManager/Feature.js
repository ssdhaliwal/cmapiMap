/**
 * This software is the property of the U.S. Government.
 * Developed by ESRI for the United States Coast Guard 
 * under contract number 40024142.     
 *
 * @version 1.1.x
 *
 * @module cmwapi-adapter/EsriOverlayManager/Feature
 */
define(["app/extensions/Vendor/esri/layers/ClientSideKMLLayer",
	"app/extensions/Vendor/esri/layers/GeoJSONLayer",
	"esri/layers/KMLLayer",
	"esri/layers/WMSLayer",
	"esri/layers/WMSLayerInfo",
	"app/extensions/ViewUtils",
	"app/extensions/JSUtils",
	"esri/geometry/Circle",
	"esri/geometry/Polygon",
	"esri/layers/GraphicsLayer",
	"esri/graphicsUtils",
	"esri/graphic",
	"esri/symbols/PictureMarkerSymbol",
	"esri/symbols/TextSymbol",
	"esri/geometry/Point",
	"esri/SpatialReference",
	"esri/symbols/Font",
	"esri/InfoTemplate",
	"esri/dijit/PopupTemplate",
	"esri/layers/FeatureLayer",
	"esri/layers/ArcGISDynamicMapServiceLayer",
	"esri/layers/ArcGISTiledMapServiceLayer",
	"esri/layers/ArcGISImageServiceLayer",
	"esri/layers/LabelClass",
	"esri/layers/CSVLayer",
	"esri/layers/RasterLayer",
	"esri/layers/VectorTileLayer",
	"esri/layers/WMTSLayer",
	"esri/layers/WMTSLayerInfo",
	"esri/layers/WebTiledLayer",
	"esri/layers/ArcGISImageServiceVectorLayer",
	"esri/renderers/VectorFieldRenderer",
	"esri/layers/StreamLayer",
	"esri/layers/WCSLayer",
	"esri/layers/WFSLayer",
	"esri/config",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/dijit/AttributeInspector",
	"dojo/dom-construct",
	"dijit/layout/ContentPane",
	"esri/tasks/query",
	"dojo/_base/Color",
	"esri/renderers/SimpleRenderer",
	"esri/renderers/UniqueValueRenderer",
	"esri/urlUtils",
	"dojo/on",
	"esri/dijit/AttributeInspector",
	"dijit/form/Button",
	"dijit/popup",
	"esri/geometry/geometryEngine",
	"esri/geometry/projection",
	"dojo/dom-style",
	"dojo/topic",
	"dojo/io-query",
	"dojo/query",
	"dojo/_base/declare",
	"dojo/_base/array"
],
	function (ClientSideKMLLayer, GeoJsonLayer, KMLLayer, WMSLayer, WMSLayerInfo, ViewUtils, JSUtils, Circle, Polygon, GraphicsLayer, graphicsUtils, Graphic, PictureMarkerSymbol,
		TextSymbol, Point, SpatialReference, Font, InfoTemplate, PopupTemplate, FeatureLayer, ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, ArcGISImageServiceLayer,
		LabelClass, CSVLayer, ArcGISRasterLayer, VectorTileLayer, WMTSLayer, WMTSLayerInfo, WebTiledLayer, ArcGISImageServiceVectorLayer, VectorFieldRenderer,
		StreamLayer, WCSLayer, WFSLayer, esriConfig, SimpleFillSymbol, SimpleLineSymbol,
		SimpleMarkerSymbol, AttributeInspector, domConstruct, ContentPane, Query, Color, SimpleRenderer, UniqueValueRenderer, urlUtils, on, AttributeInspector, Button, Popup,
		geometryEngine, projection, domStyle, topic, ioQuery, query, declare, array) {

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
		 * @description Manager for overlay layers to be used in conjunction with an ESRI map,
		 * the {@link EsriAdapter}, and the {@link Map|Common Map Widget API}
		 *
		 * @version 1.1
		 *
		 * @module cmwapi-adapter/EsriOverlayManager/Feature
		 */

		//This is the symbol associated with a marker placed on a map, the image is alrady encoded in the infodata.
		var MARKER_SYMBOL = {
			"angle": 0,
			"xoffset": 2,
			"yoffset": 8,
			"type": "esriPMS",
			"url": "http://static.arcgis.com/images/Symbols/Basic/BlueShinyPin.png",
			"imageData": "iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMU7nOPkAAA01SURBVGhD7Vn5c1X1HRVbRRMSo8QEAgmBSEIWkpCQkJCE7CRk3wMvhJAAMRuEJC/7BoEoQRbLowpURBChoYKgKGhV2mlrK3UXrWLFpT84/QPq2HHs6Tk373ZSp+1ojS90ppk5c+97ue/dz/me8znf7/e+G274/99/PwJ5rTtvK+1/2Hf18MnIsv4DYeWDh3yGXvhsyn//jZP0yYIW25Kirgf7V209eq68//ArlqGjVyxDx98o6T34fEH7Pltx9wOZk1Tat7ttYcveiJyWvefX7bmANTtPoWbPWVTfd844rtt7HuWDx1Hc8xMU9RxAftueyzmbRvK/3R0ceHVxz8GynJbdn6+//1k0PfRr1B+8hI0P/wrNR36H5kd+h5ZHX+b5K6g/8Dwqd4yicvgMyvuPIrtpx4gDy/xmtyrrPxyRVNXxl/qDv8TGI79B64lX0f3E++h8/B10/OwttPF128nX0PrY77H52Eto1vH4qyR4GRXbRqnYQds3u5ODrkqrGXiqYvgkOk+/x4J/i77zH6Dn3FV0kFD32ffQcfoKus68i45TV9B89CW0jb4O6+hbVO0VtB5/BeUDh2nHw+sdVO5/vk1+24+C48vbv9x05GUMXPgY/ec/xODFT8YIkUT7qbfQRUJSrO3EG8RrJEeSP7tinDcffRl3//g55G3eebVh5HnnSSeVu2mkYnH2emxirww++6lByjz2nL2K3qc+MNDNcynWTmWso29TzXcN0p2n36EV30D2xhGU9R7ImnRCWY3b+wPjc1Fre84g0v/0NQMi1n3uffSyaBUu6/U+yaNxfhUDT39kXNd3/hqv+Yipt5+kdrRNOqF8696dswJjUNJ72CDU++QHVOIKSbw/VuxTHxoE+njsk1pPfkgyH/N4DT1PXKU9P6Ud30NKdT/Sarr7J51Qad+BDu/gaATGl7AwjvyFT9kfY9bqOvMHdLKPVLChEl+rd3SuPuonSQ3Cxod+gfiVzUit6W6ddEIVw8cSIrPXwHm6D5at7sIgrTZw4RPDakZcP0aceIsE3zDivPnoZaNnOknO6LVnriG50orF2WuRvXlHzqQTUgEZtYOX/KPScaurO+Ism9FLq40Vy/hWGJx61yBl/SmJKfWojmHPc9eQ17IP3sGxstufspq2uV4XhCxDjy5JtLR+HppahmnuPghKLMKae08Z844KN8Be+cc5X6/f9wzCllfBfU4EYosbwHBpui7ImEWUdO9fl7jaioiMSszwC4WLxxzMW5iI2KI65LXthWXoBEp7DyGzbjvC0yxw9pgHT14XW1LHQGh/5Lohs2bkpHPF9uPFlfecOJPXshMJqzYiOq8aIUn5CIrNwPzIRPgwNHyDE+A5bxHcfYMxZ2EsonPXYpmlmdhsS66y3nhdELIMHVnDUX+7YugxWLYdZz/spAKDYE8hcXUbkle3In/z2HvLVjUhhQqm1vQh4+5B5Lfc90W+dVf6dUGEG7WbS3oeOFLSewAbbNoqnAX3OJwYh43iU6o6kLK2k8T6kdO0zSCV3TjMPhkGtwzEDhR27PvSsu3Y5PdN/YPP3lRgtV3MatrJPc7TqOU6rHzwYapznxrbIJRW3Yn09d3I2NBHJXaS1Hb+b5vWa8hpHkFmwxCKuvYj32oDV+qPVe85fcukKVXa8+BPkqt62OQnudx5gUuWfSiw3m8QMQjRTuk13Xw9gBX1gyhoGUFe8w5k1m/Rps4gnt10L893Y/XwKAra94vUiUkhZNlyrGJ57Rak1Azg7gdeRAl3nypwBUc/taYLuZtHkNWwFWlVVpLqos22oti6B4WEyMpuuVRpRf0Qz3fBsvVRVN7zOMnZsGZktN2hpPRwI69l12/jSjchv+MAmo9d5mTYPxYE9VvZ9M2GSlIio3ZgrH9IlHH+j94yFCTh5DVWDsIwd6yHUb3nKZT2H5H9vmh66JK3w0gx0QIy67Z8sShrHdbuetrYVi/KrMByFq++iGIMx6/caCRcNolkNQyyd6hQ1z5abCwscqggIxpRjPXldVv4fOGQYbs1O04jo24bKrY/OuAwQsWdtpLU6i7O7tV8LnCJO83L8ItMQkRmpaFQeMYqhKaXGXGdxabPbhqi1XahtOcBRTTyW3cbpMLTyw1CHBzk8v3Ke05xg/cC0tZvYT/ZLjmMUGG7rTGBtgpJLkPt/gvGQ4+54YmYGbCYk2iREQSxxbVUbZVhKRVf2mPDqsFDyGZMpzD5wjNWclWeY/SbMTdx3VfB+at611kkWNqQvmHwzw4lFFfWSEIl9PxhhsJzCE0tgcsdXnCfvQD+0ekGkcSKVsSVNyKutB6JLJiLThKtQ2haOd8z1mx8hnCI17VRrZVYOzKKmr0XEFPciOS1HY4jlNe6uzQ6vwb+MZmcNLtQvfsMG3vIWI+5unvDmcSmz74LvouWUYkylLbfi+rth4yekbLc6/BzHQbpJYUbcFdUGpdIa6n2RRR2HURMEQlVWa85TKHidlsYCf3Na0GkYZtsBkHlvSeNAt19/OHs5gnn22fCZbqIBSKhcBXyG3sQXVSPoKSVmBe5Aj4hyzBrwWLMnB9JLOJc9ggaDv0CS4qbsTinBssqrO86jJBuxBF+3SckBp7zIxDMLQK33/T/40yoQRYbQzKz4eI+G26ecwk/eMwJhW9YMrwCYzHdJ5BE/Ul+AWbcFWr02vq9F/nZEQTEF2BJQS3iy5vedCghjmitAsBjbjDu8ApgKCRhGXebBe33I4lK+UUmY7q3Pwv3Y18F4PaZOl+A22lFQYQ854ciIDaTfcZ5q37ECJmghFyjv1Y0bh91KCFOrjdm1A1cmMstgazl5ObBozeVCIbf4hQWlsdwyIBPaKxhLe+gGCoXz+1DrIF57C+/RUnwi0hDSMoqhKVbaN88Y7uhXtt45CWHrb7Nn0Cm6CeR9PV9H3kHx+BW9s2trh6Y6jQdU53d4XqnD9ULMfY9Xv6RJMR9UGgCZvPo5R9lYAYV8vQLw5xFKfCNSEEg1YnKrtLT06OOUkdkBG3CfkD8sLDz/gVpNT1v+tM6rtxy61mC020ecHIdCwYnN4bDHbMZFF5GrEtNl+lz4HLnXFoyGB6+YQyFKCZdOh+OVKGow/bipiO/cnEEoX8iwhveTGip7xScWDaLs/1DMYxg37ClcPX0gdsMXz79mYmp0zxwi9sMuHsHURElWgR3qiHso0A+Q1iIGf4RCFiahbiSBu6jbKcaDv7c7fskYyqio6EIMZW4lZhG6MnM7YQ74bG0pH4lZ/6LccX1CONEG5acjejMAoQnZmF+dCrmRaTCK4h9tDAZflGpCGE6xpUpAIb+yC1EnV15857fC6/xqtxkV0REbiOmE56EF+FDzCPuIub7hkSv4ERpy7y7//PKocOw9Nm+ym7Y8nlKpfWruLImJFVa/5rTdM+nXPI8SWVrA+OzPOyKa8A0cN/LT5VfJyNV5O077ERm8zhXBIggYiERTkQQkUSGv3/wB4kpaddKSy1PBAUE5cXExFjWWiotZUVluT4+PvrMTPvASGknQupr4L4XUmbjm8qIjFRREb6EPxFCLCKiiVginlhGJHI0tscsiUHc0jgE+QcN2v+v60RY5BcQUnUWcSfhRugnFJGSUrr/hCllqjPeZlLGJKNiwu1ERCKZSCMyCP0IvOLGKTeen+bsgtmz5vzNaarTBr6Xar9O1y+xD4RU8iOktkiZSilwpNKEkBpvNX2xrKDRU7+oV6RMmL0oqSEiIqFn0XmEfvxdOeWGKR+5THNBWFjYZ/b39f8VhCbMJGIpIbVESkqpFzVo6lHTehNKyEw03UA30g01msHEYiLBTkZF5hIFRBFRQlQSn7i6uCIkZOFrPC8mCu3EsnlcbicVw2M4oUHSYCkcvq7Sd7adGdHje0exLFsoAEIJ9YLUUWEqUKqYZEp5Xkb0EvuIDkLvjSelQZAFZT8FSCDhS8wgNA2ol0zbfacYNz8s/4qQkk0jJn//O0L66VBWkwIqWsULVjuZ8m9ASLZTYqpHTUITFg6mQhohk5AUUhrJcko2WS6OSCEUBFJJpArsxKRWI7HOTlKv9T9do2v1GQWJklEp+a8UmnBC4y2nHpIdfAklnEIhijATTo2uYJBaan71lJSRYiKh1yIiq8mmIqMB0XcowmVlPbZSD2nSVhBNqOWULmYoyM9uhGwnlZRIGlGTlNJKAZFEqC+UeipakBKCzvW+iKj39BmprH7UAPkSspsGTvOdnDEhE6zZQyYh03a6ibytETRXCAE8NydWFae5RYVKNREUVLygcymiVJMqspk+q3RT7yhBZWtTnQm12/hgMFWSBcaTUgFzCPWUiJlLH6mmYs3lj4gqxfRa70sRxb4+o88qqk0ybjzXFKEV/Hh1JiS2v76O04iZpHRjjaYmWllQRWmUVaB6QcXKRrKlCb2WGlq86lqTiL5DyykpY5KRK8Yvfb4zIX6fsYYySenLNWLjtw0qQH43icn/Iic7qrlVsBQUdC7ofamhcJF1RcSNkPIaLFOZCScjQv+Tf38HMj5k7OWK5X8AAAAASUVORK5CYII=",
			"contentType": "image/png",
			"width": 24,
			"height": 24
		};

		var handler = function (manager) {
			var me = this;

			/**
			 * A feature which can be plotted or displayed on a manager.payload.map.
			 * @constructor
			 * @param overlayId {String} The id of an overlay layer which will contain this feature;
			 *      If an overlay with the given ID does not exist, one will be created
			 * @param featureId {String} The id to be given to this feature. If the ID exists for the provided
			 *      ovelayId the previous feature with the given featureId will be replaced with this feature;
			 *      otherwise the feature will be created.
			 * @param name {Stirng} The non-unique readable name to give to this feature
			 * @param format {String} The format in which the feature parameter is being specified
			 * @param feature The data detailing this feature
			 * @param Zoom {boolean} Whether or not the map should zoom to this feature upon being added to the map
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature
			 */
			var Feature = function (overlayId, featureId, name, format, feature, zoom, esriObject) {

				this.overlayId = overlayId;
				//needed?
				this.featureId = featureId;
				this.name = name;
				if (!name) {
					this.name = featureId;
				}
				this.format = format;
				this.feature = feature;
				this.zoom = zoom;

				this.isHidden = false;

				this.esriObject = esriObject;
			};

			var sendError = function (caller, message, err) {
				var sender = caller;
				var type = err.type;
				var msg = message;
				var error = err;

				/*
				cmwapi.error.send(sender, type, msg, error);
				*/
			};

			function _checkProxyRule(url) {
				var urlObj = domConstruct.create("a", {
					href: url
				});

				//Function will determine if the URL needs to be passed through a proxy and returns the correct URL
				if (typeof urlUtils.getProxyRule(url) === "undefined") {
					urlUtils.addProxyRule({
						proxyUrl: esri.config.defaults.io.proxyUrl,
						urlPrefix: urlObj.hostname
					});
				}
			};


			me.addDrawFeature = function (overlayId, featureId, name, layer) {
				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'graphic', null, false, layer);
				manager.treeChanged();
			};

			/**
			 * @method plotFeatureUrl
			 * @param caller {String} the id of the widget which made the request resulting in this function call.
			 * @param overlayId {String} The id of the overlay on which this feature should be displayed
			 * @param featureId {String} The id to be given for the feature, unique to the provided overlayId
			 * @param name {String} The readable name for which this feature should be labeled
			 * @param format {String} The format type of the feature data included
			 * @param feature The url containing the data for the feature
			 * @param params //FIXME only matters for wms?
			 * @param [zoom] {boolean} Whether or not the map should zoom to this feature upon creation
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			me.plotFeatureUrl = function (caller, overlayId, featureId, name, format, url, params, zoom) {
				// close the kml layer overlapping
				$('#kml_overlaps_wrapper').css("display", "none");

				if (typeof (manager.overlays[overlayId]) === 'undefined') {
					manager.overlay.createOverlay(caller, overlayId, overlayId);
				}

				var overlay = manager.overlays[overlayId];
				if (typeof (overlay.features[featureId]) !== 'undefined') {
					me.deleteFeature(caller, overlayId, featureId);
				}

				// updated to use if specified, else use default proxy rule
				if (params && params.hasOwnProperty("useProxy")) {
					if (params.useProxy === "true") {
						_checkProxyRule(url);
					}
				}

				// fix boolean values from text to native
				params.showLabels = JSUtils.getBoolean(params.showLabels);

				//if a type we like then handler function
				if (format === 'kml') {
					plotKmlFeatureUrl(caller, overlayId, featureId, name, url, zoom);
				} else if (format === "wms") {
					plotWmsFeatureUrl(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-feature') {
					plotArcgisFeature(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-dynamicmapservice') {
					plotArcgisDynamicMapService(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-tiledmapservice') {
					plotArcgisTiledMapService(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-imageservice') {
					plotArcgisImageService(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-csv') {
					plotArcgisCsv(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-raster') {
					plotArcgisRaster(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-vectortile') {
					plotArcgisVectorTile(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'wmts') {
					plotWmts(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-webtile') {
					plotArcgisWebTile(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-imageservicevector') {
					plotArcgisImageServiceVector(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'arcgis-stream') {
					plotArcgisStream(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'wcs') {
					plotWcs(caller, overlayId, featureId, name, url, params, zoom);
				} else if (format === 'wfs') {
					if (!params.url) {
						params.url = url;
					}
					plotWfs(caller, overlayId, featureId, name, url, params, zoom);
				} else {
					var msg = "Format, " + format + " of data is not accepted";
					sendError(caller, msg, {
						msg: msg,
						type: 'invalid_data_format'
					});
				}
			};

			/**
			 * @method plotFeature
			 * @param caller {String} the id of the widget which made the request resulting in this function call.
			 * @param overlayId {String} The id of the overlay on which this feature should be displayed
			 * @param featureId {String} The id to be given for the feature, unique to the provided overlayId
			 * @param name {String} The readable name for which this feature should be labeled
			 * @param format {String} The format type of the feature data included
			 * @param feature {String} Feature data to be loaded into the map
			 * @param [zoom] {boolean} Whether or not the map should zoom to this feature upon creation
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			me.plotFeature = function (caller, overlayId, featureId, name, format, feature, zoom, properties, popupTemplate) {
				// close the kml layer overlapping
				$('#kml_overlaps_wrapper').css("display", "none");

				if (typeof (manager.overlays[overlayId]) === 'undefined') {
					manager.overlay.createOverlay(caller, overlayId, overlayId);
				}

				var overlay = manager.overlays[overlayId];
				if (typeof (overlay.features[featureId]) !== 'undefined') {
					if (feature.hasOwnProperty("remove") || feature.hasOwnProperty("add") || feature.hasOwnProperty("update")) {
						var featureLayer = overlay.features[featureId];
					} else {
						me.deleteFeature(caller, overlayId, featureId);
					}
				}

				//if a type we like then handler function
				if (format === 'kml') {
					plotKmlString(caller, overlayId, featureId, name, feature, zoom, properties, popupTemplate, featureLayer);
				} else if (format === "geojson") {
					plotGeoJsonString(caller, overlayId, featureId, name, feature, zoom, properties, popupTemplate);
				} else if (format === "graphics") {
					plotGraphicsString(caller, overlayId, featureId, name, feature, zoom, properties);
				} else {
					var msg = "Format, " + format + " of data is not accepted";
					sendError(caller, msg, {
						msg: msg,
						type: 'invalid_data_format'
					});
				}
			};

			var plotKmlString = function (caller, overlayId, featureId, name, feature, zoom, properties, popupTemplate, featureLayer) {
				var newLayer = null;
				if (featureLayer !== undefined) {
					newLayer = new ClientSideKMLLayer({
						'featureLayer': featureLayer.esriObject,
						'featureUpdates': feature
					});
				} else {
					newLayer = new ClientSideKMLLayer({
						'kmlString': feature,
						'popupTemplate': popupTemplate,
						'properties': properties
					});
					if (properties && properties.hasOwnProperty("opacity")) {
						newLayer.setOpacity(properties.opacity);
					}

					//manager.payload.map.setExtent(graphicsUtils.graphicsExtent(newLayer.graphics), true);
					newLayer.type = "clientSideKmlLayer";
					newLayer.name = featureId;
					manager.payload.map.addLayer(newLayer);

					// add hover function
					newLayer.on("mouse-over", function (evt) {
						if (!manager.payload.map.infoWindow.isShowing &&
							evt.graphic &&
							evt.graphic.attributes &&
							evt.graphic.attributes.name &&
							evt.graphic.attributes.name.trim() !== ""
						) {
							var content = evt.graphic.attributes.name;
							dialog.setContent(content);
							domStyle.set(dialog.domNode, "opacity", 0.85);
							Popup.open({
								popup: dialog,
								x: evt.pageX + 2,
								y: evt.pageY + 2
							});
						}
					});

					newLayer.on("mouse-out", function (evt) {
						Popup.close(dialog);
					});

					// add labels if defined
					handleKMLStringLabels(properties, map, newLayer);
					var overlay = manager.overlays[overlayId];
					overlay.features[featureId] = new Feature(overlayId, featureId, name, 'kml', '', zoom, newLayer);
					if (overlay.isHidden) {
						overlay.isHidden = false;
						if (newLayer.hasMapImageLayer) {
							newLayer.mapImageLayer.hide();
						}
					}
					if (JSUtils.getBoolean(zoom)) {
						if (newLayer.graphics.length) {
							//Set the extent to the graphics layer
							var extent = graphicsUtils.graphicsExtent(newLayer.graphics);
							manager.payload.map.setExtent(extent, true);
						} else if (newLayer.hasMapImageLayer) {
							//If there are no graphics but there are ground overlays then set the extent to the mapImageLayer
							var extent = newLayer.mapImageLayer._mapImages[0].extent;
							manager.payload.map.setExtent(extent, true);
						}
					}
					if (newLayer.hasMapImageLayer) {
						newLayer.on("visibility-change", function (evt) {
							if (evt.visible) {
								newLayer.mapImageLayer.show();
							} else {
								newLayer.mapImageLayer.hide();
							}
						});
					}

					addKmlFeatureListeners(caller, overlayId, featureId, newLayer);
					newLayer.on("load", function () {
						manager.notifyInfo(caller, "Layer loaded!");
					});

					newLayer.on("error", function (e) {
						_layerErrorHandler(caller, overlayId, featureId, newLayer, e);
					});
				}
			};

			var plotGeoJsonString = function (caller, overlayId, featureId, name, feature, zoom, properties, popupTemplate) {
				//kmlString = '<kml xmlns=\"http://www.opengis.net/kml/2.2\" xmlns:gx=\"http://www.google.com/kml/ext/2.2\" xmlns:kml=\"http://www.opengis.net/kml/2.2\" xmlns:atom=\"http://www.w3.org/2005/Atom\"><Placemark id=\"example.mapWidget.1.1\"><name>World Trade Center</name><description><![CDATA[Site of World Trade Center]]></description><Style><IconStyle><color>ffff00ff</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/red-blank.png</href></Icon><hotSpot x="32" y="1" xunits="pixels" yunits="pixels"/></IconStyle></Style><Point><coordinates>-74.01324033737183,40.71149172571141,0 </coordinates></Point></Placemark></kml>';
				//geoJsonString = { "type": "FeatureCollection", "features": [{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, "properties": { "prop0": "value0" } }, { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]] }, "properties": { "prop0": "value0", "prop1": 0.0 } }, { "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]]] }, "properties": { "prop0": "value0", "prop1": { "this": "that" } } }] };
				var newLayer = new GeoJsonLayer({
					'geojson': feature,
					'popupTemplate': popupTemplate
				});
				// fix for geoJson
				if (properties) {
					if (properties.hasOwnProperty("opacity")) {
						newLayer.setOpacity(properties.opacity);
					}
				}
				manager.payload.map.addLayer(newLayer);
				//manager.payload.map.setExtent(graphicsUtils.graphicsExtent(newLayer.graphics), true);
				var overlay = manager.overlays[overlayId];
				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'geojson', '', zoom, newLayer);
				if (JSUtils.getBoolean(zoom)) {
					var extent = graphicsUtils.graphicsExtent(newLayer.graphics);
					manager.payload.map.setExtent(extent, true);
				}

				addKmlFeatureListeners(caller, overlayId, featureId, newLayer);
				newLayer.on("load", function () {
					manager.notifyInfo(caller, "Layer loaded!");
				});

				newLayer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, newLayer, e);
				});
			};

			var plotGraphicsString = function (caller, overlayId, featureId, name, feature, zoom, properties) {
				var infoTemplate = new InfoTemplate();
				infoTemplate.setTitle("<b>User Defined Graphic</b>");
				infoTemplate.setContent("<table style='width:100%;'><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Name: </b></td><td style='width:85%;'><input id='nameBox' name='nameBox' type='text' size=30 width='90%' value='${Name}'></td></tr><tr><td style='width:15%;text-align:right;vertical-align:top;'><b>Comment: </b></td><td style='width:85%;'><textarea id='commentArea' name='nameArea'style='height:100px;width:90%;' rows='4'>${Comment}</textarea></td></tr><tr><td colspan='2'><b>Updated: </b>${DateEntered}</td></tr><tr><td colspan='2'><table width='100%'><tr><td style='width:50%;text-align:center;'><button id='SaveButton' onclick='saveGraphicAttributes(nameBox.value, commentArea.value);'>Save</button></td><td style='width:50%;text-align:center;'><button id='DeleteButton' onclick='deleteGraphic();'>Delete</button></td></td></table></td></tr></table>");

				var newLayer = new GraphicsLayer({
					infoTemplate: infoTemplate,
					dataAttributes: ["Name", "Comment", "DateCreated", "LatLon"],
					id: featureId
				});

				if (properties) {
					if (properties.hasOwnProperty("opacity")) {
						newLayer.setOpacity(properties.opacity);
					}
				}
				manager.payload.map.infoWindow.resize(350, 240);

				var attr = {
					"Name": " ",
					"Comment": " ",
					"DateEntered": " "
				};

				for (var i = 0; i < feature.features.length; i++) {
					var graphic = new Graphic(feature.features[i]);

					// update attributes
					if (feature.features[i].hasOwnProperty("attributes")) {
						attr.Name = feature.features[i].attributes.Name || "";
						attr.Comment = feature.features[i].attributes.Comment || "";
						attr.DateEntered = feature.features[i].attributes.DateEntered || new Date().toLocaleString();
					}

					graphic.setAttributes(JSON.parse(JSON.stringify(attr)));
					graphic.setInfoTemplate(infoTemplate);
					newLayer.add(graphic);

					newLayer.on("mouse-over", function (evt) {
						if (!manager.payload.map.infoWindow.isShowing &&
							evt.graphic &&
							evt.graphic.attributes &&
							evt.graphic.attributes.Name &&
							evt.graphic.attributes.Name.trim() !== ""
						) {
							var content = evt.graphic.attributes.Name;
							dialog.setContent(content);
							domStyle.set(dialog.domNode, "opacity", 0.85);
							Popup.open({
								popup: dialog,
								x: evt.pageX + 2,
								y: evt.pageY + 2
							});
						}
					});
					newLayer.on("mouse-out", function (evt) {
						Popup.close(dialog);
					});
				}

				manager.payload.map.addLayer(newLayer);
				//manager.payload.map.setExtent(graphicsUtils.graphicsExtent(newLayer.graphics), true);
				var overlay = manager.overlays["User Defined"];
				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				overlay.features[featureId] = new Feature("User Defined", featureId, name, 'graphic', '', zoom, newLayer);

				if (JSUtils.getBoolean(zoom)) {
					var extent = graphicsUtils.graphicsExtent(newLayer.graphics);
					manager.payload.map.setExtent(extent, true);
				}

				newLayer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, newLayer, e);
				});
			};

			/**
			 * @method plotMarker
			 * @param caller {String} the id of the widget which made the request resulting in this function call.
			 * @param overlayId {String} The id of the overlay on which this marker should be displayed
			 * @param featureId {String} The id to be given for the feature, unique to the provided overlayId
			 * @param name {String} The readable name for which this feature should be labeled
			 * @param marker {String} The icon and location information of the marker to be placed.
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			window.QuickIconCallback = function (element, overlayId, featureId, action) {
				// find the marker based on overlayId, and featureid
				var overlay = manager.overlays[overlayId];
				var layer = overlay.features[featureId];

				var description = $("#qiIPPopupComment").val();
				var name = $("#qiIPPopupName").val();
				var group = $("#qiIPPopupGroup").val();
				var iconSize = $("input[name='qiIPPopupSize']:checked").val();

				// close the open window
				manager.payload.map.infoWindow.hide();

				// apply the update to store
				if (action === "HIDE") {
					manager.payload.map.QuickIcon.hideItem(featureId);
				} else if (action === "UPDATE") {
					manager.payload.map.QuickIcon.updateItem({
						id: featureId,
						description: description,
						iconSize: iconSize,
						attributes: {
							name: name,
							group: group
						}
					}, true);
				} else {
					manager.payload.map.QuickIcon.deleteRow(featureId, true);
				}

				// send message
				OWF.Eventing.publish("manager.payload.map.feature.update", JSON.stringify({
					overlayId: overlayId,
					featureId: featureId,
					action: action,
					attributes: {
						description: description,
						name: name,
						group: group,
						iconSize: iconSize
					}
				}));
			};
			me.unplotMarker = function (caller, overlayId, featureId) {
				// close the kml layer overlapping
				$('#kml_overlaps_wrapper').css("display", "none");
				manager.payload.map.QuickIcon.dragging = false;

				var overlay = manager.overlays[overlayId];
				if (typeof (overlay.features[featureId]) !== 'undefined') {
					me.deleteFeature(caller, overlayId, featureId);
				}

				manager.treeChanged();
			};
			me.plotMarker = function (caller, overlayId, featureId, name, marker, zoom) {
				// close the kml layer overlapping
				$('#kml_overlaps_wrapper').css("display", "none");
				manager.payload.map.QuickIcon.dragging = false;

				if (typeof (manager.overlays[overlayId]) === 'undefined') {
					manager.overlay.createOverlay(caller, overlayId, overlayId);
				}
				var overlay = manager.overlays[overlayId];
				if (typeof (overlay.features[featureId]) !== 'undefined') {
					me.deleteFeature(caller, overlayId, featureId);
				}

				var layer = new GraphicsLayer();
				var iconSize = 25;
				if (marker.hasOwnProperty("iconSize")) {
					if (marker.iconSize === "small") {
						iconSize = 15;
					} else if (marker.iconSize === "large") {
						iconSize = 32;
					}
				} else {
					marker.iconSize = "medium";
				}
				var markerImage = marker.iconUrl ? {
					url: marker.iconUrl,
					height: iconSize,
					width: iconSize
				} : MARKER_SYMBOL;
				var symbol = new PictureMarkerSymbol(markerImage);
				var point = new Point(marker.latlon.lon, marker.latlon.lat);
				var graphic = new Graphic(point, symbol);
				//var infoTemplate = new InfoTemplate();

				// process extended data
				var attributes = marker.attributes;
				if ((attributes === null) && (attributes === undefined)) {
					attributes = {};
					attributes.id = featureId;
					attributes.name = name;
				} else {
					attributes.id = featureId;
					attributes.name = name;
				}
				graphic.setAttributes(attributes);

				var infoTemplate = new InfoTemplate();
				var content = "";
				if (!marker.hasOwnProperty("description") || marker.description === undefined || marker.description === null) {
					marker.description = "";
				}
				if (!marker.hasOwnProperty("quickIcon") || marker.quickIcon === undefined || marker.quickIcon === null || marker.quickIcon === false) {
					content = marker.description.replace(/(?:\\[rn]|[\r\n])/g, "</br>");
				} else {
					content = "<textarea id='qiIPPopupComment' class='qiInputText' rows='7' cols='35' style='width:100%;resize:none;'>" +
						marker.description + "</textarea>";
				}
				content += "<hr>";
				content +=
					"<div class=\"esriViewPopup\"><div class=\"mainSection\"><table class=\"attrTable\" cellpadding=\"2px\" cellspacing=\"0px\"> " +
					"<tbody> ";
				for (var field in attributes) {
					if (field.toLowerCase() === "graphic") { } else if (field.toLowerCase() === "name") {
						if (!marker.hasOwnProperty("quickIcon") || marker.quickIcon === undefined || marker.quickIcon === null || marker.quickIcon === false) {
							content += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" + attributes[field] + "</td></tr> ";
						} else {
							content += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" +
								"<input id='qiIPPopupName' class='qiInput' type='text' size='25' value='" + attributes[field] + "'></td></tr> ";
						}
					} else if (field.toLowerCase() === "group") {
						if (!marker.hasOwnProperty("quickIcon") || marker.quickIcon === undefined || marker.quickIcon === null || marker.quickIcon === false) {
							content += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" + attributes[field] + "</td></tr> ";
						} else {
							content += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" +
								"<input id='qiIPPopupGroup' class='qiInput' type='text' size='25' value='" + ((attributes[field] === null || attributes[field] === undefined) ? "" : attributes[field]) + "'></td></tr> ";
						}
					} else {
						content += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" + attributes[field] + "</td></tr> ";
					}
				}

				content += "	<tr valign=\"top\"><td class=\"attrName\">size</td><td class=\"attrValue\">" +
					"<input type=\"radio\" name=\"qiIPPopupSize\" value=\"small\"" + ((marker.iconSize === "small") ? " checked=\"checked\"" : "") +
					"	style=\"vertical-align: middle;margin-bottom: 5px;\"> Sm" +
					" <input type=\"radio\" name=\"qiIPPopupSize\" value=\"medium\"" + ((marker.iconSize === "medium") ? " checked=\"checked\"" : "") +
					"	style=\"vertical-align: middle;margin-bottom: 5px;\"> Md" +
					" <input type=\"radio\" name=\"qiIPPopupSize\" value=\"large\"" + ((marker.iconSize === "large") ? " checked=\"checked\"" : "") +
					"	style=\"vertical-align: middle;margin-bottom: 5px;\"> Lg</td></tr>";

				content +=
					"</tbody> " +
					"</table></div></div>";
				content += "<hr>lat: " + marker.latlon.lat + "</br>lon: " + marker.latlon.lon;
				if (!marker.hasOwnProperty("quickIcon") || marker.quickIcon === undefined || marker.quickIcon === null || marker.quickIcon === false) { } else {
					content += "</br></br>" +
						"<a href='#' onclick='javascript:window.QuickIconCallback(this, \"" + overlayId + "\", \"" + featureId + "\", \"HIDE\");return false;'>HIDE</a> | " +
						"<a href='#' onclick='javascript:window.QuickIconCallback(this, \"" + overlayId + "\", \"" + featureId + "\", \"UPDATE\");return false;'>UPDATE</a> | " +
						"<a href='#' onclick='javascript:window.QuickIconCallback(this, \"" + overlayId + "\", \"" + featureId + "\", \"DELETE\");return false;'>DELETE</a>";
				}

				infoTemplate.setTitle(name);
				infoTemplate.setContent(content);
				graphic.setInfoTemplate(infoTemplate);

				layer.add(graphic);
				manager.payload.map.addLayer(layer);
				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				if (zoom === "center") {
					manager.payload.map.centerAt(point);
				} else if (zoom === "true") {
					manager.payload.map.setZoom(10);
					manager.payload.map.centerAt(point);
				}
				//if (JSUtils.getBoolean(marker.centerOnMap)) {
				//	manager.payload.map.centerAt(point);
				//}
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'marker', graphic, null, layer);

				// Add the original marker data to the feature so it can be recreated if persisted to OWF preferences or elsewhere.
				overlay.features[featureId].marker = marker;

				OWF.Eventing.publish("manager.payload.map.message.complete", JSON.stringify({
					overlayId: "Quick Icon",
					featureId: marker.attributes.id,
					attributes: {
						description: marker.description,
						iconUrl: marker.iconUrl,
						latlon: {
							lon: marker.latlon.lon.toString(),
							lat: marker.latlon.lat.toString()
						},
						date: marker.attributes.date,
						group: marker.attributes.group,
						name: marker.attributes.name,
						orignalName: marker.attributes.orignalName
					},
					quickIcon: marker.quickIcon,
					iconSize: marker.iconSize,
					zoom: marker.zoom
				}));

				// add new marker to the qi list
				if (marker.hasOwnProperty("quickIcon") && (marker.quickIcon === true)) {
					manager.payload.map.QuickIcon.updateItem(marker, false);
				}

				// add hover function
				layer.on("mouse-over", function (evt) {
					if (!manager.payload.map.infoWindow.isShowing &&
						evt.graphic &&
						evt.graphic.attributes &&
						evt.graphic.attributes.name &&
						evt.graphic.attributes.name.trim() !== ""
					) {
						var content = evt.graphic.attributes.name;
						dialog.setContent(content);
						domStyle.set(dialog.domNode, "opacity", 0.85);
						Popup.open({
							popup: dialog,
							x: evt.pageX + 2,
							y: evt.pageY + 2
						});
					}
				});

				layer.on("mouse-out", function (evt) {
					Popup.close(dialog);
				});

				layer.on('click', function (e) {
					// exit if dragging quickicon
					if (marker.hasOwnProperty("quickIcon") && manager.payload.map.QuickIcon.dragging) {
						return false;
					}

					// close the kml layer overlapping
					$('#kml_overlaps_wrapper').css("display", "none");

					var selectedFeature = {};
					selectedFeature.overlayId = overlayId;
					selectedFeature.featureId = featureId;
					selectedFeature.deselectedId = e.graphic.attributes.id;
					selectedFeature.deselectedName = e.graphic.attributes.name;
					manager.pushSelectedFeature(selectedFeature);
					/*
					cmwapi.feature.selected.send({
						overlayId: overlayId,
						featureId: featureId,
						selectedId: e.graphic.attributes.id,
						selectedName: e.graphic.attributes.name
					});
					cmwapi.status.selected.send({
						overlayId: overlayId,
						selectedFeatures: [{
							featureId: featureId,
							selectedId: e.graphic.attributes.id
						}]
					});
					cmwapi.feature.clicked.send({
						overlayId: overlayId,
						featureId: featureId,
						lat: e.mapPoint.y,
						lon: e.mapPoint.x,
						button: "left",
						type: "single",
						keys: []
					});
					*/
				});

				if (marker.hasOwnProperty("quickIcon")) {
					layer.on('dbl-click', function (e) {
						// close the kml layer overlapping
						$('#kml_overlaps_wrapper').css("display", "none");

						let markerUpdate = JSON.parse(JSON.stringify(marker));

						//OWF.DragAndDrop.startDrag({"dragDropData": {"overlayId": overlayId, "featureId": featureId, "name":"", "zoom":true, "marker": marker}});
						manager.payload.map.QuickIcon.dragging = true;
						manager.payload.map.QuickIcon.draggingMarker = markerUpdate;

						// hide and show cursor to active drag-drop on same location
						manager.payload.map.setMapCursor("move");
					});
				}

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/**
			 * Plots a kml layer via url to the map
			 * @private
			 * @method plotKmlFeatureUrl
			 * @param caller {String} The widget making a request that led to this method call
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature
			 * @param name {String} The non-unique readable name to give to the feature
			 * @param url {String} The url containing kml data to be plotted
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			var plotKmlFeatureUrl = function (caller, overlayId, featureId, name, url, zoom) {
				// KMLLayer seems to unencode
				// URLs before passing them to a server-based parser.  This will break if the
				// URL includes spaces and other characters that need to be encode.  To avoid this,
				// We encode it before sending it to the layer constructor.  Technically, this could
				// send along a double-encoded url string, but that seems to be required.
				var id = overlayId + " - " + featureId;
				var layer = new KMLLayer(encodeURI(url), {
					id: id
				});

				// add search options
				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'kml-url', url, zoom, layer);

				// no params passed; no searchOptions

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				addKmlFeatureListeners(caller, overlayId, featureId, layer);
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						me.zoom(caller, overlayId, featureId, null, null, "auto");
					}
					manager.notifyInfo(caller, "Layer loaded!");
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			var _layerErrorHandler = function (caller, overlayId, featureId, layer, e) {
				var msg = 'Unable to apply layer - ' + e.error;
				manager.notifyError(caller, msg);
				sendError(caller, msg, {
					msg: msg,
					type: 'layer_error'
				});
				me.deleteFeature(caller, overlayId, featureId);
			};

			/**
			 * A function that adds a kml strings labels to the map if the labels property is set.
			 * @param {*} properties the properties objected checked for labels settings
			 * @param {*} map the map to add the label layer to.
			 * @param {*} layer the layer containing the label Layer.
			 */
			var handleKMLStringLabels = function (properties, map, layer) {
				if (properties && properties.hasOwnProperty("labels")) {
					if (properties.labels.visible) {
						// add the label to the map
						manager.payload.map.addLayer(layer.labelLayer);
						if (properties.labels.zoom) {
							var scale;
							if (properties.labels.zoom.min) {
								// Calculate scale from zoom
								scale = (591657550.500000 / Math.pow(2, Number(properties.labels.zoom.min)));
								layer.labelLayer.setMinScale(scale);
							}
							if (properties.labels.zoom.max) {
								// Calculate scale from zoom
								scale = (591657550.500000 / Math.pow(2, Number(properties.labels.zoom.min)));
								layer.labelLayer.setMaxScale(scale);
							}
						}
						// Handler for when the parent layer is removed
						manager.payload.map.on("layer-remove", function (event) {
							if (layer.id === event.layer.id) {
								manager.payload.map.removeLayer(layer.labelLayer);
							}
							manager.payload.map.infoWindow.hide();

							// if query select; remove the graphic layer

							// close the kml layer overlapping
							$('#kml_overlaps_wrapper').css("display", "none");
						});
						// Handler for when the parent layers visibility is changed.
						layer.on("visibility-change", function (event) {
							layer.labelLayer.setVisibility(event.visible);
						});
					}
				}
			};

			/**
			 * Recursively adds listeners to kml layer data in order to bind to kml select events
			 * @private
			 * @param caller {String} The widget making a request that led to this method call
			 * @param overlayId {String} The unique id of the overlay containing the feature to be selected
			 * @param featureId {String} The id, unique to the overlay, to be given to the selected feature
			 * @param layer {String} Top KML layer that will be recursed down.
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			var addKmlFeatureListeners = function (caller, overlayId, featureId, layer) {
				var sendSelected = function (e) {
					// close the kml layer overlapping
					$('#kml_overlaps_wrapper').css("display", "none");

					var scanRange = (manager.payload.map.getMaxZoom() - manager.payload.map.getZoom()) * .10;
					var circle = new Circle({
						center: e.mapPoint,
						geodesic: true,
						radius: scanRange,
						radiusUnit: "esriMiles"
					});

					var overlappingFeatures = [];
					manager.data.utilities.projectionPromise.then(function () {
						var circleGeometry = projection.project(circle, e.graphic.geometry.spatialReference);
						/*
						var polygonGeometry, polylineGeometry;
						if (e.graphic.geometry.type === 'polygon') {
							polygonGeometry = e.graphic.geometry;
						}
						if (e.graphic.geometry.type === 'polyline') {
							polylineGeometry = e.graphic.geometry;
						}
						*/
						var graphics = e.graphic._graphicsLayer.graphics;
						graphics.map(function (graphic) {
							var graphicGeometry = graphic.geometry;

							if (graphic.geometry.type === 'point') {
								if (!graphic.circleGraphic) {
									graphic.circleGraphic = new Circle({
										center: graphic.geometry,
										geodesic: true,
										radius: 500,
										radiusUnit: "esriMeters",
										spatialReference: graphic.spatialReference
									});
								}

								graphicGeometry = graphic.circleGraphic;
							}

							if (geometryEngine.contains(graphicGeometry, circleGeometry) || geometryEngine.contains(circleGeometry, graphicGeometry)) {
								overlappingFeatures.push(graphic);
							} else if (geometryEngine.crosses(graphicGeometry, circleGeometry) || geometryEngine.crosses(circleGeometry, graphicGeometry)) {
								overlappingFeatures.push(graphic);
							} else if (geometryEngine.equals(graphicGeometry, circleGeometry)) {
								overlappingFeatures.push(graphic);
							} else if (geometryEngine.intersects(graphicGeometry, circleGeometry) || geometryEngine.intersects(circleGeometry, graphicGeometry)) {
								overlappingFeatures.push(graphic);
							} else if (geometryEngine.overlaps(graphicGeometry, circleGeometry) || geometryEngine.overlaps(circleGeometry, graphicGeometry)) {
								overlappingFeatures.push(graphic);
							} else if (geometryEngine.touches(graphicGeometry, circleGeometry) || geometryEngine.touches(circleGeometry, graphicGeometry)) {
								overlappingFeatures.push(graphic);
							} else if (geometryEngine.within(circleGeometry, graphicGeometry) || geometryEngine.within(graphicGeometry, circleGeometry)) {
								overlappingFeatures.push(graphic);
							}
						});
					});

					if (overlappingFeatures.length > 1) {
						$("#kml_overlaps_data").empty();

						var selectedFeatures = [];
						overlappingFeatures.forEach(function (item, index) {
							$("#kml_overlaps_data").append("<div style='background-color: " + ((index % 2) ? "#96C0CE" : "#BEB9B5") + ";overflow-x: hidden;padding: 0 5px 0 5px;'>" +
								item.attributes.id + "</br>" + item.attributes.name + "</div>"); // item.infoTemplate.content

							var selectedFeature = {};
							selectedFeature.overlayId = overlayId;
							selectedFeature.featureId = featureId;
							selectedFeature.deselectedId = item.attributes.id;
							selectedFeature.deselectedName = item.attributes.name;
							manager.pushSelectedFeature(selectedFeature);

							/*
							cmwapi.feature.selected.send({
								overlayId: overlayId,
								featureId: featureId,
								selectedId: item.attributes.id,
								selectedName: item.attributes.name
							});
							*/

							selectedFeatures.push({
								featureId: featureId,
								selectedId: item.attributes.id
							});
						});

						$('#kml_overlaps_wrapper').css("display", "block");
						$('#kml_overlaps_wrapper').width(250);

						/*
						cmwapi.status.selected.send({
							overlayId: overlayId,
							selectedFeatures: selectedFeatures
						});
						*/
					} else {
						var selectedFeature = {};
						selectedFeature.overlayId = overlayId;
						selectedFeature.featureId = featureId;
						selectedFeature.deselectedId = e.graphic.attributes.id;
						selectedFeature.deselectedName = e.graphic.attributes.name;
						manager.pushSelectedFeature(selectedFeature);
						/*
						cmwapi.feature.selected.send({
							overlayId: overlayId,
							featureId: featureId,
							selectedId: e.graphic.attributes.id,
							selectedName: e.graphic.attributes.name
						});
						cmwapi.status.selected.send({
							overlayId: overlayId,
							selectedFeatures: [{
								featureId: featureId,
								selectedId: e.graphic.attributes.id
							}]
						});
						*/
					}

					/*
					cmwapi.feature.clicked.send({
						overlayId: overlayId,
						featureId: featureId,
						lat: e.mapPoint.y,
						lon: e.mapPoint.x,
						button: "left",
						type: "single",
						keys: []
					});
					*/
				};
				var sendMousedown = function (e) {
					/*
					cmwapi.feature.mousedown.send({
						overlayId: overlayId,
						featureId: featureId,
						lat: e.mapPoint.y,
						lon: e.mapPoint.x,
						button: "left",
						type: "single",
						keys: []
					});
					*/
				};
				var sendMouseup = function (e) {
					/*
					cmwapi.feature.mouseup.send({
						overlayId: overlayId,
						featureId: featureId,
						lat: e.mapPoint.y,
						lon: e.mapPoint.x,
						button: "left",
						type: "single",
						keys: []
					});
					*/
				};

				(function onLoadListenRecurse(currLayer) {
					currLayer = currLayer.layer ? currLayer.layer : currLayer;
					var curr;
					if (typeof (currLayer.getLayers) === 'function') {
						curr = currLayer.getLayers();
					} else {
						curr = currLayer.getLayers;
					}

					if (curr) {
						for (var i = 0; i < curr.length; i++) {
							if (curr[i].loaded) {
								curr[i].on('click', sendSelected);
								curr[i].on('mouse-down', sendMousedown);
								curr[i].on('mouse-up', sendMouseup);
							} else {
								curr[i].on('load', onLoadListenRecurse);
							}
						}
					} else {
						if (currLayer.loaded) {
							currLayer.on('click', sendSelected);
							currLayer.on('mouse-down', sendMousedown);
							currLayer.on('mouse-up', sendMouseup);
						} else {
							currLayer.on('load', onLoadListenRecurse);
						}
					}
				})(layer);
			};

			/**
			 * Plots a wms layer via url to the map
			 * @private
			 * @param caller {String} The widget making a request that led to this method call
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature
			 * @param name {String} The non-unique readable name to give to the feature
			 * @param url {String} The url containing kml data to be plotted
			 * @param params {Object} wms params to be used when pulling data from the url
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			var plotWmsFeatureUrl = function (caller, overlayId, featureId, name, url, params, zoom) {
				var layerInfos;
				if (Array.isArray(params.layers)) {
					layerInfos = [];
					for (var i = 0; i < params.layers.length; i++) {
						layerInfos.push(new WMSLayerInfo({
							name: params.layers[i],
							title: params.layers[i]
						}));
					}
				} else {
					layerInfos = [new WMSLayerInfo({
						name: params.layers,
						title: params.layers
					})];
				}

				/* id controls legend display -- must be unique */
				var id = overlayId + " - " + featureId;
				var details = {
					id: id,
					extent: manager.payload.map.geographicExtent,
					layerInfos: layerInfos
				};
				var layer = new WMSLayer(url, details);

				layer.setVisibleLayers([params.layers]);
				var transparent = false;
				if (params.hasOwnProperty(transparent)) {
					transparent = params.transparent;
				}
				layer.setImageTransparency(transparent);
				if (params.hasOwnProperty("opacity")) {
					layer.setOpacity(params.opacity);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];

				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'wms-url', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						me.zoom(caller, overlayId, featureId, null, null, "auto");
					}
					manager.notifyInfo(caller, "Layer loaded!");

				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/**
			 * Plots a Arcgis Specific Feature Layer via url to the map
			 * @private
			 * @param caller {String} The widget making a request that led to this method call
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature
			 * @param name {String} The non-unique readable name to give to the feature
			 * @param url {String} The url containing kml data to be plotted
			 * @param params {Object} wms params to be used when pulling data from the url
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			manager.payload.map.on("layer-remove", function (obj) {
				topic.publish("map/layer/remove", obj.layer);
				// manager.payload.map.infoWindow.hide();

				// close the kml layer overlapping
				$('#kml_overlaps_wrapper').css("display", "none");
			});
			window.OWFGlobalPublish = function (channel, payload) {
				payload.mapId = window.cmwapiMapId;
				OWF.Eventing.publish(channel, JSON.stringify(payload));
			};

			function getLayerUrlInfoTemplate(graphic) {
				// address search items; which do not have custom template mapping
				if (((graphic.getLayer()).infoTemplateClass === undefined) ||
					((graphic.getLayer()).infoTemplateClass.reference === undefined)) {
					var description =
						"<div class=\"esriViewPopup\"><div class=\"mainSection\"><table class=\"attrTable\" cellpadding=\"2px\" cellspacing=\"0px\"> " +
						"<tbody> ";

					Object.keys(graphic.attributes).forEach(function (field) {
						if (!field.startsWith("search")) {
							description += "        <tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" + graphic.attributes[field] + "</td></tr> ";
						}
					});
					description += "</tbody> " + "</table></div></div>"
					return description;
				}

				// perform normal template mapping on click
				var ref = (graphic.getLayer()).infoTemplateClass.reference;
				var overlay = manager.overlays[ref.overlayId];
				var params = overlay.features[ref.featureId].params;
				var url = ref.linkSet.url;
				var nodeText = "<div id=\"popupUrl_397295\" style=\"position:relative; ";
				if ((ref.ignoreHeight === undefined) || (Boolean(ref.ignoreHeight) === false)) {
					nodeText += "height:225px; ";
				}
				nodeText += "width:100%;\">";

				if (ref.linkSet.wrapper === "div") {
					nodeText += "Loading content...</div>";
				} else {
					nodeText += "<iframe id=\"popupUrl_397295_frame\" style=\"position:relative; height:100%; width:100%;\" src=\"\"></iframe></div>";
				}

				//nodeText += "<iframe src=\"https://www.allareacodes.com/325\"></iframe></div>";
				//var node = domConstruct.toDom(nodeText);
				ref.linkSet.fields.forEach(function (field) {
					url = url.replace("\$\{" + field + "\}", graphic.attributes[field]);
				});

				// add attributes and command set if needed
				nodeText += "<hr>" + (ref.description ? (ref.description + "<hr>") : "");
				if (ref.showAttributes &&
					JSUtils.getBoolean(ref.showAttributes)) {
					nodeText +=
						"<div class=\"esriViewPopup\"><div class=\"mainSection\"><table class=\"attrTable\" cellpadding=\"2px\" cellspacing=\"0px\"> " +
						"<tbody> ";
					Object.keys(graphic.attributes).forEach(function (field) {
						if ((params.outFields[0] === "*") ||
							(params.outFields.indexOf(field) >= 0) || false) {
							nodeText += "	<tr valign=\"top\"><td class=\"attrName\">" + field + "</td><td class=\"attrValue\">" + graphic.attributes[field] + "</td></tr> ";
						}
					});
					nodeText +=
						"</tbody> " +
						"</table></div></div>";
				}
				if (ref.commandSet && ref.commandSet.title && ref.commandSet.channel && ref.commandSet.fields &&
					ref.commandSet.actions) {
					nodeText += "<hr>" +
						(ref.commandSet.title || "") + " - ";
					var actionData = "";
					ref.commandSet.fields.forEach(function (field) {
						var alias = field.split(";");
						if (alias.length > 1) {
							actionData += "\"" + alias[1] + "\":\"" + graphic.attributes[alias[0]] + "\","
						} else {
							actionData += "\"" + field + "\":\"" + graphic.attributes[field] + "\","
						}
					});
					if (ref.commandSet.staticFields) {
						actionData += "staticFields:" + JSON.stringify(ref.commandSet.staticFields);
					}
					ref.commandSet.actions.forEach(function (action) {
						nodeText += "<a style='padding-right: 5px;' href='javascript:window.OWFGlobalPublish(\"" +
							ref.commandSet.channel + "\", {" +
							"\"" + action.name + "\":\"" + action.value + "\"," + actionData + "});'>" + action.name + "</a>";
					});
				}

				// fprmat as node to render
				var node = domConstruct.toDom(nodeText);

				window.setTimeout(function (url, wrapperType) {
					if (wrapperType === "div") {
						$("#popupUrl_397295").load(url);
					} else {
						$("#popupUrl_397295_frame").attr("src", url);
					}
				}, 1000, url, ref.linkSet.wrapper);
				return node;
			};

			function getLayerControlInfoTemplate(graphic) {
				// Display attribute information.
				var node = domConstruct.toDom("<div>I'm a Node {" + graphic.attributes.FID + "}<br>" +
					OWF.getInstanceId() + "<br>" +
					"<a href='javascript:window.OWFGlobalPublish(234);'>click here</a></div>");
				return node;
			};
			var plotArcgisFeature = function (caller, overlayId, featureId, name, url, params, zoom) {
				var layerFeatures;
				params = params || {};
				if (!params.hasOwnProperty("mode")) {
					params.mode = FeatureLayer.MODE_ONDEMAND;
				} else {
					if (params.mode === "snapshot") {
						params.mode = FeatureLayer.MODE_SNAPSHOT;
					} else if (params.mode === "ondemand") {
						params.mode = FeatureLayer.MODE_ONDEMAND;
					} else if (params.mode === "selection") {
						params.mode = FeatureLayer.MODE_SELECTION;
					} else if (params.mode === "auto") {
						params.mode = FeatureLayer.MODE_AUTO;
					}
				}
				if (!params.outFields) {
					params.outFields = ['*'];
				}

				var layer = new FeatureLayer(url, params);
				window.global_tmp = layer;

				var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 0.35]), 1), new Color([125, 125, 125, 0.35]));

				//Handle additional parameters
				if (params.editable) {
					layer.setEditable(params.editable);
				}
				if (params.labelingInfo) {
					layer.setLabelingInfo(params.labelingInfo);
				}
				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}
				if (params.renderer) {
					switch (params.rendererType) {
						case "simple":
							var simpleRenderer = new SimpleRenderer(params.renderer);
							layer.setRenderer(simpleRenderer);
							break;
						case "uniqueValue":
							var uniqueValueRenderer = new UniqueValueRenderer(params.renderer)
							layer.setRenderer(uniqueValueRenderer);
							break;
					}
				}
				if (params.selectionSymbol) {
					var type = params.selectionSymbol.type;
					var symbolJson = params.selectionSymbol.color;

					if (type == 'Point') {
						var symbol = new SimpleMarkerSymbol(symbolJson);
					} else if (type == 'Line') {
						var symbol = new SimpleLineSymbol(symbolJson);
					} else if (type == 'Polygon') {
						var symbol = new SimpleFillSymbol(symbolJson);
					}
					layer.setSelectionSymbol(symbol);
				}
				if (params.timeDefinition) {
					layer.setTimeDefinition(params.timeDefinition);
				}
				if (params.timeOffset) {
					layer.setTimeOffset(params.timeOffset);
				}
				if (params.featureReduction) {
					layer.setFeatureReduction(params.featureReduction);
				}

				if (params.showLabels && (params.showLabels === true || params.showLabels === "true") && params.labelClass) {
					//create a text symbol and renderer to define the style of labels
					var labelSymbol = new TextSymbol();
					if (params.labelTextSymbol) {
						if (params.labelTextSymbol.font) {
							tsFont = new Font(params.labelTextSymbol.font);
							labelSymbol.setFont(tsFont);
						}
						if (params.labelTextSymbol.color) {
							tsColor = new Color(params.labelTextSymbol.color);
							labelSymbol.setColor(tsColor);
						}
						if (params.labelTextSymbol.angle) {
							labelSymbol.setAngle(params.labelTextSymbol.angle);
						}
						if (params.labelTextSymbol.haloColor) {
							labelSymbol.setHaloColor(new Color(params.labelTextSymbol.haloColor));
						}
						if (params.labelTextSymbol.haloSize) {
							labelSymbol.setHaloSize(params.labelTextSymbol.haloSize);
						}
						if (params.labelTextSymbol.offset) {
							labelSymbol.setOffset(params.labelTextSymbol.offset.x, params.labelTextSymbol.offset.y);
						}
						if (params.labelTextSymbol.rotated) {
							labelSymbol.setRotated(params.lableTextSymbol.rotated);
						}
						if (params.labelTextSymbol.verticalAlignment) {
							labelSymbol.setVerticalAlignment(params.labelTextSymbol.verticalAlignment);
						}
						if (params.labelTextSymbol.horizontalAlignment) {
							labelSymbol.setHorizontalAlignment(params.labelTextSymbol.horizontalAlignment);
						}
					}

					var lcJson = params.labelClass;
					//create instance of LabelClass
					var lc = new LabelClass(lcJson);
					lc.symbol = labelSymbol;
					// symbol also can be set in LabelClass' json
					layer.setLabelingInfo([lc]);
				}

				// added for query/selection
				if (params.hasOwnProperty("_querySelect")) {
					// create graphic layer for adding
					var bufferLayer = new GraphicsLayer({
						id: featureId + "_buffer"
					});

					params._querySelect.graphic = [];
					params._querySelect.filters.forEach(filter => {
						var graphic = null;
						if (filter.type === "buffer") {
							filter.geometry.forEach(marker => {
								var point = new Point(marker.x, marker.y,
									new SpatialReference({
										wkid: filter.wkid || 4326
									}));

								if (filter.hasOwnProperty("range")) {
									if (!filter.range.hasOwnProperty("1") && !filter.range.hasOwnProperty("2")) {
										var buffer = new Circle({
											center: point,
											geodesic: filter.geodesic || true,
											radius: filter.range,
											radiusUnit: filter.measureUnit || "esriMiles"
										});

										graphic = new Graphic(buffer, new SimpleFillSymbol(
											SimpleFillSymbol.STYLE_NULL,
											new SimpleLineSymbol(
												SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
												new Color([105, 105, 105]),
												2
											), new Color([255, 255, 0, 0.25])
										));

										params["_querySelect"].graphic.push(buffer);
										bufferLayer.add(graphic);
									} else {
										if (filter.range.hasOwnProperty("1")) {
											var buffer = new Circle({
												center: point,
												geodesic: filter.geodesic || true,
												radius: filter.range["1"],
												radiusUnit: filter.measureUnit || "esriMiles"
											});

											graphic = new Graphic(buffer, new SimpleFillSymbol(
												SimpleFillSymbol.STYLE_SOLID,
												new SimpleLineSymbol(
													SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
													new Color([105, 105, 105]),
													2
												), new Color([255, 255, 0, 0.25])
											));

											params["_querySelect"].graphic.push(buffer);
											bufferLayer.add(graphic);
										}

										if (filter.range.hasOwnProperty("2")) {
											var buffer = new Circle({
												center: point,
												geodesic: filter.geodesic || true,
												radius: filter.range["2"],
												radiusUnit: filter.measureUnit || "esriMiles"
											});

											graphic = new Graphic(buffer, new SimpleFillSymbol(
												SimpleFillSymbol.STYLE_NULL,
												new SimpleLineSymbol(
													SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
													new Color([105, 105, 105]),
													2
												), new Color([255, 255, 0, 0.25])
											));

											params["_querySelect"].graphic.push(buffer);
											bufferLayer.add(graphic);
										}
									}
								} else {
									var buffer = new Circle({
										center: point,
										geodesic: filter.geodesic || true,
										radius: 20,
										radiusUnit: filter.measureUnit || "esriMiles"
									});

									graphic = new Graphic(buffer, new SimpleFillSymbol(
										SimpleFillSymbol.STYLE_SOLID,
										new SimpleLineSymbol(
											SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
											new Color([105, 105, 105]),
											2
										), new Color([255, 255, 0, 0.25])
									));

									params["_querySelect"].graphic.push(buffer);
									bufferLayer.add(graphic);
								}
							});

							//bufferLayer.setOpacity(1.0);
						}
						if (filter.type === "area") {
							filter.geometry.forEach(ring => {
								var buffer = new Polygon({
									"rings": ring.rings,
									"spatialReference": { "wkid": filter.wkid || 4326 }
								});

								graphic = new Graphic(buffer, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
									new SimpleLineSymbol(SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
										new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25])
								));

								params["_querySelect"].graphic.push(buffer);
								bufferLayer.add(graphic);
							})
						}
					});

					layer.bufferLayer = bufferLayer;
					manager.payload.map.addLayers([bufferLayer]);

					// layer.setMinScale(9244648.868618);
					// layer.bufferLayer.setMinScale(9244648.868618);

					// get extent of all graphics for query limitation
					var layerExtent = graphicsUtils.graphicsExtent(bufferLayer.graphics);
					params.definitionExpression = params.definitionExpression || {};
					params.definitionExpression.geometry = layerExtent;
					params.definitionExpression.geometryType = "esriGeometryPolygon";
					params.definitionExpression.spatialRel = "esriSpatialRelIntersects";
				}

				if (params.definitionExpression) {
					layer.setDefinitionExpression(params.definitionExpression);
				}

				manager.payload.map.addLayers([layer]);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'arcgis-feature', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}

				var udCap;

				/*
				layer.on("visibility-change", (visibility) => {
					console.log("visibility-change", visibility);
				});
				*/
				layer.on("graphic-add", (feature) => {
					if (params.hasOwnProperty("_querySelect")) {
						let qsLen = params._querySelect.graphic.length;
						let found = false;
						for (let i = 0; i < qsLen; i++) {
							if (params._querySelect.graphic[i].contains(feature.graphic.geometry)) {
								i = qsLen;
								found = true;
							}
						}
						if (!found) {
							feature.graphic.hide();
						}
					}
				});

				/*
				layer.on("graphic-draw", function ($event) {
					console.log("graphic-draw", $event);
				});
				layer.on("query-count-complete", function ($event) {
					console.log("query-count-complete", $event);
				});
				layer.on("query-extent-complete", function ($event) {
					console.log("query-extent-complete", $event);
				});
				layer.on("query-ids-complete", function ($event) {
					console.log("query-ids-complete", $event);
				});
				layer.on("query-features-complete", function ($event) {
					console.log("query-features-complete", $event);
				});

				layer.on("refresh-tick", function ($event) {
					if (params.hasOwnProperty("_querySelect")) {
						var tmpGraphicsLayer = new GraphicsLayer({
							id: "tmp_" + layer.id
						});
						let tGraphic;
						layer.graphics.forEach((graphic) => {
							if (graphic.visible === true) {
								tGraphic = new Graphic(graphic.toJson());
								tGraphic.symbol = layer.renderer.symbol.toJson();
								tGraphic.visible = true;
								tmpGraphicsLayer.graphics.push(tGraphic);
							}
						});
						if (tmpGraphicsLayer.graphics.length > 0) {
							manager.payload.map.addLayer(tmpGraphicsLayer);
							layer["tmpGraphicsLayer"] = tmpGraphicsLayer;
						}
					}
				});

				layer.on("update-end", function ($event) {
					if (params.hasOwnProperty("_querySelect")) {
						if (layer.hasOwnProperty("tmpGraphicsLayer")) {
							manager.payload.map.removeLayer(layer.tmpGraphicsLayer);
							delete layer["tmpGraphicsLayer"];
						}
					}
				});
				*/

				layer.on("load", function ($event) {
					// set font color if needed
					if ($event.layer.hasOwnProperty("labelingInfo")) {
						if ($event.layer.labelingInfo.length > 0) {
							$event.layer.labelingInfo.forEach(label => {
								if (label.hasOwnProperty("symbol")) {
									if (label.symbol.hasOwnProperty("color")) {
										label.symbol.color = new Color(manager.payload.map.basemapFontColor);
										delete label.symbol.haloColor;
										delete label.symbol.haloSize;
									}
								}
							});
						}
					}

					// adjust for infoTemplate
					if ((!params.infoTemplateClass) ||
						(params.infoTemplateClass.type === "default")) {
						var fieldInfos = array.map(layer.fields, function (field) {
							var showField =
								(params.outFields[0] === "*") ||
								(params.outFields.indexOf(field.name) >= 0) || false;
							return {
								"fieldName": field.name,
								"label": field.alias,
								"visible": showField
							}
						});

						var template = new PopupTemplate({
							title: "Attributes",
							fieldInfos: fieldInfos,
						});
						layer.setInfoTemplate(template);
					} else if (params.infoTemplateClass) {
						if (params.infoTemplateClass.type === "standard") {
							if (params.infoTemplateClass.standard) {
								var template = new InfoTemplate();
								template.setTitle(params.infoTemplateClass.standard.title);
								var description = (params.infoTemplateClass.standard.description ? (params.infoTemplateClass.standard.description + "<hr>") : "");
								if (params.infoTemplateClass.standard.showAttributes &&
									JSUtils.getBoolean(params.infoTemplateClass.standard.showAttributes)) {
									description +=
										"<div class=\"esriViewPopup\"><div class=\"mainSection\"><table class=\"attrTable\" cellpadding=\"2px\" cellspacing=\"0px\"> " +
										"<tbody> ";
									layer.fields.forEach(function (field) {
										if ((params.outFields[0] === "*") ||
											(params.outFields.indexOf(field.name) >= 0) || false) {
											description += "	<tr valign=\"top\"><td class=\"attrName\">" + field.name + "</td><td class=\"attrValue\">${" + field.name + "}</td></tr> ";
										}
									});
									description +=
										"</tbody> " +
										"</table></div></div>";
								}
								if (params.infoTemplateClass.standard.commandSet &&
									params.infoTemplateClass.standard.commandSet.title &&
									params.infoTemplateClass.standard.commandSet.channel &&
									params.infoTemplateClass.standard.commandSet.fields &&
									params.infoTemplateClass.standard.commandSet.actions) {
									description += "<hr>" +
										(params.infoTemplateClass.standard.commandSet.title || "") + " - ";
									var actionData = "";
									params.infoTemplateClass.standard.commandSet.fields.forEach(function (field) {
										var alias = field.split(";");
										if (alias.length > 1) {
											actionData += "\"" + alias[1] + "\":\"${" + alias[0] + "}\","
										} else {
											actionData += "\"" + field + "\":\"${" + field + "}\","
										}
									});
									if (params.infoTemplateClass.standard.commandSet.staticFields) {
										actionData += "staticFields:" + JSON.stringify(params.infoTemplateClass.standard.commandSet.staticFields);
									}
									params.infoTemplateClass.standard.commandSet.actions.forEach(function (action) {
										description += "<a style='padding-right: 5px;' href='javascript:window.OWFGlobalPublish(\"" +
											params.infoTemplateClass.standard.commandSet.channel + "\", {" +
											"\"" + action.name + "\":\"" + action.value + "\"," + actionData + "});'>" + action.name + "</a>";
									});
								}
								template.setContent(description);
								layer.setInfoTemplate(template);
							}
						} else if (params.infoTemplateClass.type === "reference") {
							if (params.infoTemplateClass.reference) {
								var template = new InfoTemplate();
								template.setTitle(params.infoTemplateClass.reference.title);

								layer.infoTemplateClass = {};
								layer.infoTemplateClass.reference = params.infoTemplateClass.reference;
								layer.infoTemplateClass.reference.overlayId = overlayId;
								layer.infoTemplateClass.reference.featureId = featureId;

								template.setContent(getLayerUrlInfoTemplate);
								layer.setInfoTemplate(template);
							}
						}
					}

					udCap = layer.getEditCapabilities();
					if (udCap.canCreate) {
						topic.publish("map/layer/FeatureLayer/Added", layer);
					}
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				var selectQuery = new Query();
				layer.on('click', function (e) {
					// close the kml layer overlapping
					$('#kml_overlaps_wrapper').css("display", "none");

					var layer = e.graphic.getLayer();

					// update popup dynamically
					if (e.ctrlKey === true) {
						var template = new esri.InfoTemplate();
						// Flag icons are from http://twitter.com/thefella, released under creative commons.
						template.setTitle("<b>${NAME}</b>");
						template.setContent(getLayerControlInfoTemplate);
						layer.setInfoTemplate(template);

						return false;
					}

					// click actions
					var selectedFeature = {};
					selectedFeature.overlayId = overlayId;
					selectedFeature.featureId = featureId;
					selectedFeature.deselectedId = e.graphic.getLayer().id;
					selectedFeature.deselectedName = e.graphic.getLayer().name;

					manager.pushSelectedFeature(selectedFeature);
					/*
					cmwapi.feature.clicked.send({
						overlayId: overlayId,
						featureId: featureId,
						lat: e.mapPoint.y,
						lon: e.mapPoint.x,
						button: "left",
						type: "single",
						keys: []
					});
					cmwapi.status.selected.send({
						overlayId: overlayId,
						selectedFeatures: [{
							featureId: featureId,
							selectedId: e.graphic.attributes.id
						}]
					});
					*/
					if (e.graphic.geometry.type === "point") {
						selectQuery.geometry = ViewUtils.pointToExtent(map, e.graphic.geometry, 10);
					} else {
						selectQuery.geometry = e.graphic.geometry;
					}

					layer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW, function (features) {
						if (features.length > 0) {
							var featureItems = [];
							var featureGeometry = {};
							for (var fi = 0; fi < features.length; fi++) {
								featureGeometry = JSON.parse(JSON.stringify(features[fi].geometry));
								featureItems.push({
									attributes: features[fi].attributes,
									geometry: featureGeometry
								});
							}

							/*
							cmwapi.feature.selected.send({
								overlayId: overlayId,
								featureId: featureId,
								selectedId: e.graphic.getLayer().id,
								selectedName: e.graphic.getLayer().name,
								features: featureItems
							});
							*/
						} else {
							/*
							cmwapi.feature.selected.send({
								overlayId: overlayId,
								featureId: featureId,
								selectedId: e.graphic.getLayer().id,
								selectedName: e.graphic.getLayer().name
							});
							*/
						}
					});
				});

				layer.on('mouse-down', function (e) {
					/*
					cmwapi.feature.mousedown.send({
						overlayId: overlayId,
						featureId: featureId,
						lat: e.mapPoint.y,
						lon: e.mapPoint.x,
						button: "left",
						type: "single",
						keys: []
					});
					*/
				});

				layer.on('mouse-up', function (e) {
					/*
					cmwapi.feature.mouseup.send({
						overlayId: overlayId,
						featureId: featureId,
						lat: e.mapPoint.y,
						lon: e.mapPoint.x,
						button: "left",
						type: "single",
						keys: []
					});
					*/
				});

				layer.on("error", function (e) {
					/*
					if (e.hasOwnProperty("error")) {
						console.log(e.error);

						if (e.error.hasOwnProperty("code")) {
							if ((e.error.code >= 400) && (e.error.code < 600)) {
								_layerErrorHandler(caller, overlayId, featureId, layer, e);
							}
						}
					}
					*/
				});

				manager.treeChanged();
			};

			/**
			 * Plots a Arcgis Specific Dynamic Service Layer via url to the map
			 * @private
			 * @param caller {String} The widget making a request that led to this method call
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature
			 * @param name {String} The non-unique readable name to give to the feature
			 * @param url {String} The url containing kml data to be plotted
			 * @param params {Object} wms params to be used when pulling data from the url
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			var plotArcgisDynamicMapService = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				var layer = new ArcGISDynamicMapServiceLayer(url, params);

				//Handle additional parameters
				if (params.dpi) {
					var dpi = params.dpi;
					layer.setDPI(dpi);
				}
				if (params.disableClientCaching) {
					layer.setDisableClientCaching(params.disableClientCaching);
				}
				if (params.dynamicLayerInfos) {
					var infoLayerArray = params.dynamicInfoLayers;
					layer.setDynamicLayerInfos(infoLayerArray);
				}
				if (params.imageFormat) {
					var imageFormat = params.imageFormat;
					layer.setImageFormat(imageFormath);
				}
				if (params.imageTransparency) {
					var imageTransparency = params.imageTransparency;
					layer.setImageTransparency(imageTransparency);
				}
				if (params.layerDefinitions) {
					var layerDefinitions = params.layerDefinitions;
					layer.setLayerDefinitions(layerDefinitions);
				}
				if (params.layerDrawingOptions) {
					var layerDrawingOptions = params.layerDrawingOptions;
					layer.setLayerDrawingOptions(layerDrawingOptions);
				}
				if (params.layerTimeOptions) {
					var layerTimeOptions = params.layerTimeOptions;
					layer.setLayerDrawingOptions(layerTimeOptionst);
				}
				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}
				if (params.visibleLayers) {
					layer.setVisibleLayers(params.visibleLayers);
				}
				if (params.definitionExpression) {
					layer.setDefinitionExpression(params.definitionExpression);
				}

				// remove token info before adding to the map
				// based on https://community.esri.com/message/91816/#comment-372370
				if (url.indexOf("?") >= 0) {
					var lUrl = url.substring(0, url.indexOf("?"));
					var lUrlQuery = url.substring(url.indexOf("?") + 1, url.length);
					var lQuery = ioQuery.queryToObject(lUrlQuery);
					delete lQuery.token;

					if ($.isEmptyObject(lQuery)) {
						layer.url = lUrl;
					} else {
						layer.url = lUrl + "?" + ioQuery.objectToQuery(lQuery);
					}
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'arcgis-dynamicmapservice', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/**
			 * Plots a Arcgis Specific Tiled Service Layer via url to the map
			 * @private
			 * @param caller {String} The widget making a request that led to this method call
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature
			 * @param name {String} The non-unique readable name to give to the feature
			 * @param url {String} The url containing kml data to be plotted
			 * @param params {Object} wms params to be used when pulling data from the url
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			var plotArcgisTiledMapService = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				var layer = new ArcGISTiledMapServiceLayer(url, params);
				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'arcgis-tiledmapservice', url, zoom, layer);
				overlay.features[featureId].params = params;
				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/**
			 * Plots a Arcgis Specific Image Layer via url to the map
			 * @private
			 * @param caller {String} The widget making a request that led to this method call
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature
			 * @param name {String} The non-unique readable name to give to the feature
			 * @param url {String} The url containing kml data to be plotted
			 * @param params {Object} wms params to be used when pulling data from the url
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			var plotArcgisImageService = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				var layer = new ArcGISImageServiceLayer(url, params);

				if (params.bandIds) {
					layer.setBandIds(params.bandIds);
				}
				if (params.compressionQuality) {
					layer.setCompressionQuality(params.compressionQuality);
				}
				if (params.definitionExpression) {
					layer.setDefinitionExpression(params.definitionExpression);
				}
				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'arcgis-imageservice', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/**
			 * Plots a Arcgis Specific CSV Layer via url to the map 
			 * @private 
			 * @param caller {String} The widget making a request that led to this method call 
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted 
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature 
			 * @param name {String} The non-unique readable name to give to the feature 
			 * @param url {String} The url containing kml data to be plotted 
			 * @param params {Object} wms params to be used when pulling data from the url 
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted 
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature# 
			 */

			var plotArcgisCsv = function (caller, overlayId, featureId, name, url, params, zoom) {
				// URLs before passing them to a server-based parser.  This will break if the 
				// URL includes spaces and other characters that need to be encode.  To avoid this, 
				// We encode it before sending it to the layer constructor.  Technically, this could 
				// send along a double-encoded url string, but that seems to be required. 
				var id = overlayId + " - " + featureId;
				params = params || {};
				params.mode = FeatureLayer.MODE_ONDEMAND;
				if (!params.outFields) {
					params.outFields = ['*'];
				}
				var layer = new CSVLayer(encodeURI(url), params);

				if (params.editable) {
					layer.setEditable(params.editable);
				}
				if (params.labelingInfo) {
					layer.setLabelingInfo(params.labelingInfo);
				}
				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}
				if (params.renderer) {
					switch (params.rendererType) {
						case "simple":
							var simpleRenderer = new SimpleRenderer(params.renderer);
							layer.setRenderer(simpleRenderer);
							break;
						case "uniqueValue":
							var uniqueValueRenderer = new UniqueValueRenderer(params.renderer)
							layer.setRenderer(uniqueValueRenderer);
							break;
					}
				}
				if (params.selectionSymbol) {
					var type = params.selectionSymbol.type;
					var symbolJson = params.selectionSymbol.symbolJson;

					if (type == 'Point') {
						var symbol = new SimpleMarkerSymbol(symbolJson);
					} else if (type == 'Line') {
						var symbol = new SimpleLineSymbol(symbolJson);
					} else if (type == 'Polygon') {
						var symbol = new SimpleFillSymbol(symbolJson);
					}
					layer.setSelectionSymbol(symbol);

				}
				if (params.timeDefinition) {
					layer.setTimeDefinition(params.timeDefinition);
				}
				if (params.timeOffset) {
					layer.setTimeOffset(params.timeOffset);
				}
				//if (params.featureReduction) { 
				//if (params.featureReduction.infoTemplate) {
				//    var reductionTemplate = new InfoTemplate(params.featureReduction.infoTemplate);           
				//    params.featureReduction.infoTemplate = reductionTemplate; 
				//} 
				//layer.setFeatureReduction(params.featureReduction); 
				//} 

				if (params.labelClass) {
					//create a text symbol and renderer to define the style of labels 
					var labelSymbol = new TextSymbol();
					if (params.labelTextSymbol) {
						if (params.labelTextSymbol.font) {
							tsFont = new Font(params.labelTextSymbol.font);
							labelSymbol.setFont(tsFont);
						}
						if (params.labelTextSymbol.color) {
							tsColor = new Color(params.labelTextSymbol.color);
							labelSymbol.setColor(tsColor);
						}
						if (params.labelTextSymbol.angle) {
							labelSymbol.setAngle(params.labelTextSymbol.angle);
						}
						if (params.labelTextSymbol.haloColor) {
							labelSymbol.setHaloColor(new Color(params.labelTextSymbol.haloColor));
						}
						if (params.labelTextSymbol.haloSize) {
							labelSymbol.setHaloSize(params.labelTextSymbol.haloSize);
						}
						if (params.labelTextSymbol.offset) {
							labelSymbol.setOffset(params.labelTextSymbol.offset.x, params.labelTextSymbol.offset.y);
						}
						if (params.labelTextSymbol.rotated) {
							labelSymbol.setRotated(params.lableTextSymbol.rotated);
						}
						if (params.labelTextSymbol.verticalAlignment) {
							labelSymbol.setVerticalAlignment(params.labelTextSymbol.verticalAlignment);
						}
						if (params.labelTextSymbol.horizontalAlignment) {
							labelSymbol.setHorizontalAlignment(params.labelTextSymbol.horizontalAlignment);
						}
					}

					var lcJson = params.labelClass;
					//create instance of LabelClass 
					var lc = new LabelClass(lcJson);
					lc.symbol = labelSymbol;
					// symbol also can be set in LabelClass' json 
					layer.setLabelingInfo([lc]);
				}
				if (params.definitionExpression) {
					layer.setDefinitionExpression(params.definitionExpression);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'arcgis-csv', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/** 
			 * Plots a Arcgis Specific Raster Layer via url to the map 
			 * @private 
			 * @param caller {String} The widget making a request that led to this method call 
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted 
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature 
			 * @param name {String} The non-unique readable name to give to the feature 
			 * @param url {String} The url containing kml data to be plotted 
			 * @param params {Object} wms params to be used when pulling data from the url 
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted 
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature# 
			 */
			var plotArcgisRaster = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				var layer = new ArcGISRasterLayer(url, params);

				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}

				if (params.opacity) {
					layer.setOpacity(params.opacity);
				}

				if (params.refreshInterval) {
					layer.setRefreshInterval(params.refreshInterval);
				}

				if (params.useMapTime) {
					layer.setUseMapTime(params.useMapTime);
				}

				if (params.pixelFilter) {
					layer.setPixelFilter(params.pixelFilter);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'arcgis-imageservice', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/** 
			 * Plots a Arcgis Specific Vector Tile Layer via url to the map 
			 * @private 
			 * @param caller {String} The widget making a request that led to this method call 
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted 
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature 
			 * @param name {String} The non-unique readable name to give to the feature 
			 * @param url {String} The url containing kml data to be plotted 
			 * @param params {Object} wms params to be used when pulling data from the url 
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted 
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature# 
			 */
			var plotArcgisVectorTile = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				var layer = new VectorTileLayer(url, params);

				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}

				if (params.opacity) {
					layer.setOpacity(params.opacity);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'arcgis-vectortile', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/** 
			 * Plots a WMTS Layer via url to the map 
			 * @private 
			 * @param caller {String} The widget making a request that led to this method call 
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted 
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature 
			 * @param name {String} The non-unique readable name to give to the feature 
			 * @param url {String} The url containing kml data to be plotted 
			 * @param params {Object} wms params to be used when pulling data from the url 
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted 
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature# 
			 */
			var plotWmts = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				var layer = new WMTSLayer(url, params);

				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}

				if (params.opacity) {
					layer.setOpacity(params.opacity);
				}

				if (params.refreshInterval) {
					layer.setRefreshInterval(params.refreshInterval);
				}

				if (params.activeLayer) {
					layer.setActiveLayer(params.activeLayer);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'WMTS', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/** 
			 * Plots a ArcGIS Web Tile Layer via url to the map 
			 * @private 
			 * @param caller {String} The widget making a request that led to this method call 
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted 
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature 
			 * @param name {String} The non-unique readable name to give to the feature 
			 * @param url {String} The url containing kml data to be plotted 
			 * @param params {Object} wms params to be used when pulling data from the url 
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted 
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature# 
			 */
			var plotArcgisWebTile = function (caller, overlayId, featureId, name, urlTemplate, params, zoom) {
				params = params || {};
				var layer = new WebTiledLayer(urlTemplate, params);

				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}

				if (params.opacity) {
					layer.setOpacity(params.opacity);
				}

				if (params.refreshInterval) {
					layer.setRefreshInterval(params.refreshInterval);
				}

				if (params.activeLayer) {
					layer.setActiveLayer(params.activeLayer);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'WMTS', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/** 
			 * Plots an ArcGIS Image Service Vector Layer via url to the map 
			 * @private 
			 * @param caller {String} The widget making a request that led to this method call 
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted 
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature 
			 * @param name {String} The non-unique readable name to give to the feature 
			 * @param url {String} The url containing kml data to be plotted 
			 * @param params {Object} wms params to be used when pulling data from the url 
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted 
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature# 
			 */
			var plotArcgisImageServiceVector = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				var layer = new ArcGISImageServiceVectorLayer(url, params);

				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}

				if (params.opacity) {
					layer.setOpacity(params.opacity);
				}

				if (params.refreshInterval) {
					layer.setRefreshInterval(params.refreshInterval);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'ArcGIS-imageservicevector', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/** 
			 * Plots an ArcGIS Stream Layer via url to the map 
			 * @private 
			 * @param caller {String} The widget making a request that led to this method call 
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted 
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature 
			 * @param name {String} The non-unique readable name to give to the feature 
			 * @param url {String} The url containing kml data to be plotted 
			 * @param params {Object} wms params to be used when pulling data from the url 
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted 
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature# 
			 */
			var plotArcgisStream = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				if (!params.outFields) {
					params.outFields = ['*'];
				}
				var layer = new StreamLayer(url, params);

				if (params.maxScale) {
					layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					layer.setMinScale(params.minScale);
				}

				if (params.opacity) {
					layer.setOpacity(params.opacity);
				}
				if (params.definitionExpression) {
					layer.setDefinitionExpression(params.definitionExpression);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'ArcGIS-stream', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/** 
			 * Plots a WCS Layer via url to the map 
			 * @private 
			 * @param caller {String} The widget making a request that led to this method call 
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted 
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature 
			 * @param name {String} The non-unique readable name to give to the feature 
			 * @param url {String} The url containing kml data to be plotted 
			 * @param params {Object} wms params to be used when pulling data from the url 
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted 
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature# 
			 */
			var plotWcs = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				var layer = new WCSLayer(url, params);

				if (params.opacity) {
					layer.setOpacity(params.opacity);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'wcs', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/** 
			 * Plots a WFS Layer via url to the map 
			 * @private 
			 * @param caller {String} The widget making a request that led to this method call 
			 * @param overlayId {String} The unique id of the overlay containing the feature to be plotted 
			 * @param featureId {String} The id, unique to the overlay, to be given to the plotted feature 
			 * @param name {String} The non-unique readable name to give to the feature 
			 * @param url {String} The url containing kml data to be plotted 
			 * @param params {Object} wms params to be used when pulling data from the url 
			 * @param [zoom] {Boolean} If the plotted feature should be zoomed to upon being plotted 
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature# 
			 */
			var plotWfs = function (caller, overlayId, featureId, name, url, params, zoom) {
				params = params || {};
				var layer = new WFSLayer(url, params);

				if (params.opacity) {
					layer.setOpacity(params.opacity);
				}

				manager.payload.map.addLayer(layer);

				var overlay = manager.overlays[overlayId];
				overlay.features[featureId] = new Feature(overlayId, featureId, name, 'wfs', url, zoom, layer);
				overlay.features[featureId].params = params;

				// add search options
				syncSearchOptions();

				if (overlay.isHidden) {
					overlay.isHidden = false;
				}
				layer.on("load", function () {
					if (JSUtils.getBoolean(zoom)) {
						arcgisZoom(layer);
					}
				});

				layer.on("error", function (e) {
					_layerErrorHandler(caller, overlayId, featureId, layer, e);
				});

				manager.treeChanged();
			};

			/** 
			 * Method to zoom to Arcgis specific layers based on a bug that will not allow you to set the extent of
			 * a map to an extent with a spacial reference of a different type.
			 * @private
			 * @param layer {String} The layer in which to get extent and chnage view to that extent
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			var arcgisZoom = function (layer) {
				var projectParams = new esri.tasks.ProjectParameters();
				projectParams.geometries = [layer.initialExtent];
				projectParams.outSR = manager.payload.map.spatialReference;
				esriConfig.defaults.geometryService = new esri.tasks.GeometryService(window.esriGeometryService);
				var defer = esriConfig.defaults.geometryService.project(projectParams);
				dojo.when(defer, function (projectedGeometry) {
					if (projectedGeometry.length > 0) {
						manager.payload.map.setExtent(projectedGeometry[0], true);
					}
				});
			};

			/**
			 * @method deleteFeature
			 * @param overlayId {String} The id of the overlay which contains the feature to be removed
			 * @param featureId {String} The id of the feature which is to be removed
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			me.deleteFeature = function (caller, overlayId, featureId) {
				var overlay = manager.overlays[overlayId];
				var msg;
				if (typeof (overlay) === 'undefined') {
					msg = "Overlay could not be found with id " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.unplot",
						msg: msg
					});
					return;
				}

				var feature = overlay.features[featureId];
				if (typeof (feature) === 'undefined') {
					msg = "Feature could not be found with id " + featureId + " and overlayId " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.unplot",
						msg: msg
					});
					return;
				}

				// remove feature from search (update search)
				var params = feature.params;
				if (params && params.hasOwnProperty("searchOptions")) {
					var sources = manager.data.utilities.search.get("sources");
					var index = sources.indexOf(feature.esriObject.searchOptions);
					if (index > -1) {
						sources.splice(index, 1);

						manager.data.utilities.search.set("sources", sources);
						manager.data.utilities.search.startup();
					}
				}

				if (feature.esriObject) { // we may have added to the tree, but are still in state on pulling up esri layers
					if (feature.esriObject.hasMapImageLayer) {
						manager.payload.map.removeLayer(feature.esriObject.mapImageLayer);
					}
					var rLayer = manager.payload.map.getLayer(feature.esriObject.id);
					if (rLayer) {
						if (rLayer.bufferLayer) {
							manager.payload.map.removeLayer(rLayer.bufferLayer);
						}
						manager.payload.map.removeLayer(rLayer);
					}
				}
				delete overlay.features[featureId];
				manager.treeChanged();
			};

			/**
			 * @method hideFeature
			 * @param overlayId {String} The id of the overlay which contains the feature to be hidden
			 * @param featureId {String} The id of the feature which is to be hidden
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			me.hideFeature = function (caller, overlayId, featureId) {
				var overlay = manager.overlays[overlayId];
				var msg;
				if (typeof (overlay) === 'undefined') {
					msg = "Overlay could not be found with id " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.hide",
						msg: msg
					});
					return;
				}
				var feature = overlay.features[featureId];
				if (typeof (feature) === 'undefined') {
					msg = "Feature could not be found with id " + featureId + " and overlayId " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.hide",
						msg: msg
					});
					return;
				}
				if (!feature.isHidden) {
					feature.isHidden = true;
					feature.esriObject.hide();
					manager.treeChanged();
				}

				// remove feature from search (update search)
				syncSearchOptions();
			};

			/**
			 * @method showFeature
			 * @param caller {String} The id of the widget which made the request resulting in this call.
			 * @param overlayId {String} The id of the overlay which contains the feature to be shown
			 * @param featureId {String} The id of the feature which is to be shown
			 * @param zoom {boolean} When true, the map will automatically zoom to the feature when shown.
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			me.showFeature = function (caller, overlayId, featureId, zoom) {
				var overlay = manager.overlays[overlayId];
				var msg;
				if (typeof (overlay) === 'undefined') {
					msg = "Overlay could not be found with id " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.show",
						msg: msg
					});
					return;
				}
				var feature = overlay.features[featureId];
				if (typeof (feature) === 'undefined') {
					msg = "Feature could not be found with id " + featureId + " and overlayId " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.show",
						msg: msg
					});
					return;
				}

				if (JSUtils.getBoolean(zoom)) {
					me.zoom(caller, overlayId, featureId, null, null, "auto");
				}

				if (feature.isHidden) {
					if (overlay.isHidden === true) {
						overlay.isHidden = false;
					}
					feature.isHidden = false;
					feature.esriObject.show();
					manager.treeChanged();
				}

				// re-add feature from search (update search)
				syncSearchOptions();
			};

			/**
			 * @method zoom
			 * @param caller {String}
			 * @param overlayId {String}
			 * @param featureId {String}
			 * @param [selectedId] {String}  Not used at present
			 * @param [selectedName] {String} Not used at present
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			me.zoom = function (caller, overlayId, featureId, selectedId, selectedName, range) {
				var overlay = manager.overlays[overlayId];
				var msg;
				if (typeof (overlay) === 'undefined') {
					msg = "Overlay could not be found with id " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.zoom",
						msg: msg
					});
					return;
				}
				var feature = overlay.features[featureId];
				if (typeof (feature) === 'undefined') {
					msg = "Feature could not be found with id " + featureId + " and overlayId " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.zoom",
						msg: msg
					});
					return;
				}

				//wms -> noop -- Can't center or zoom on wms because wms always responds to current extent
				if (feature.format !== 'wms' && feature.format !== 'wms-url') {
					var extent = ViewUtils.findLayerExtent(feature.esriObject);

					if (extent) {
						// If auto zoom, reset the entire extent.
						if (range && range.toString().toLowerCase() === "auto") {
							manager.payload.map.setExtent(extent, true);
						}
						// If we have a non-auto zoom, recenter the map and zoom.
						else if (typeof range !== "undefined") {
							// Set the zoom level.
							manager.payload.map.setScale(ViewUtils.zoomAltitudeToScale(map, range));

							// Recenter the manager.payload.map.
							manager.payload.map.centerAt(extent.getCenter());
						}
						// Otherwise, use recenter the manager.payload.map.
						else {
							manager.payload.map.centerAt(extent.getCenter());
						}
					}
				}
				//If wms then check if zoom property is included and change map extent.
				else {
					if (typeof range !== "undefined") {
						manager.payload.map.setScale(ViewUtils.zoomAltitudeToScale(map, range));
					}
				}
			};

			/**
			 * @method centerFeature
			 * @param caller {String}
			 * @param overlayId {String}
			 * @param featureId {String}
			 * @param [selectedId] {String}
			 * @param [selectedName] {String}
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			me.centerFeatureGraphic = function (caller, overlayId, featureId, selectedId, selectedName) {
				var overlay = manager.overlays[overlayId];
				var msg;
				if (typeof (overlay) === 'undefined') {
					msg = "Overlay could not be found with id " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.zoom",
						msg: msg
					});
					return;
				}
				var feature = overlay.features[featureId];
				if (typeof (feature) === 'undefined') {
					msg = "Feature could not be found with id " + featureId + " and overlayId " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.zoom",
						msg: msg
					});
					return;
				}
				var layers = feature.esriObject.getLayers();
				recurseGraphic(layers, selectedId, selectedName);
			};

			var recurseGraphic = function (currLayerArr, selectedId, selectedName) {
				for (var i = 0; i < currLayerArr.length; i++) {
					var currLayer = currLayerArr[i].layer || currLayerArr[i];
					if (currLayer.graphics) {
						var graphics = currLayer.graphics;
						for (var j = 0; j < graphics.length; j++) {
							if (graphics[j].attributes.id === selectedId || graphics[j].attributes.name === selectedName) {
								if (graphics[j].geometry.type.toLowerCase() === 'point') {
									manager.payload.map.centerAt(graphics[j].geometry);
								} else if (graphics[j].geometry.type.toLowerCase() === 'extent') {
									manager.payload.map.centerAt(graphics[j].geometry.getCenter());
								} else {
									manager.payload.map.centerAt(graphics[j].geometry.getExtent().getCenter());
								}
							}
						}
					} else if (!currLayer.graphics && (typeof (currLayer.getLayers) != "undefined")) {
						recurseGraphic(currLayer.getLayers(), selectedId, selectedName);
					}
				}
			};

			/**
			 * @method updateFeature
			 * @param overlayId {String}
			 * @param featureId {String}
			 * @param [name] {String}
			 * @param [newOverlayId] {String}
			 * @memberof module:cmwapi-adapter/EsriOverlayManager/Feature#
			 */
			me.updateFeature = function (caller, overlayId, featureId, name, newOverlayId) {
				var msg = "";
				if (typeof (manager.overlays[overlayId]) === 'undefined' || typeof (manager.overlays[overlayId].features[featureId]) === 'undefined') {
					msg = "Feature could not be found with id " + featureId + " and overlayId " + overlayId;
					sendError(caller, msg, {
						type: "manager.payload.map.feature.update",
						msg: msg
					});
				} else {
					var feature = manager.overlays[overlayId].features[featureId];

					if (name && name !== feature.name) {
						manager.overlays[overlayId].features[featureId].name = name;
					}

					if (newOverlayId && newOverlayId !== overlayId) {
						feature.overlayId = newOverlayId;
						if (typeof (manager.overlays[newOverlayId]) === 'undefined') {
							//FIXME What should happen here?.
							manager.overlay.createOverlay(caller, newOverlayId, newOverlayId);
							//msg = "Could not find overlay with id " + newOverlayId;
							//sendError(caller, msg, {type: "manager.payload.map.feature.update", msg: msg});
						}
						name = (name ? name : feature.name);

						var oldId = feature.esriObject.id;
						var newIdString = newOverlayId + " - " + featureId;
						//feature.esriObject.id = newIdString;
						//feature.esriObject._titleForLegend = newIdString;

						if (typeof (feature.esriObject.getLayers) === 'function') {
							emitKmlUpdate(overlayId, newOverlayId, feature.esriObject);
						} else {
							manager.payload.map.emit('layerUpdated', {
								old_id: oldId,
								layer: feature.esriObject
							});
						}

						var newFeature = new Feature(newOverlayId, featureId, name, feature.format, feature.feature, feature.zoom, feature.esriObject);

						newFeature.params = feature.params;
						manager.overlays[newOverlayId].features[featureId] = newFeature;
						delete manager.overlays[overlayId].features[featureId];

						//hide it if the new overlay is hidden
						if (manager.overlays[newOverlayId].isHidden) {
							me.hideFeature(caller, newOverlayId, featureId);
						}

					}
					manager.treeChanged();
				}
			};

			var emitKmlUpdate = function (oldId, newId, layer) {
				var layers = layer.getLayers();
				for (var i = 0; i < layers.length; i++) {
					if (typeof (layers[i].getLayers) === 'function') {
						emitKmlUpdate(layers[i]);
					} else {
						var oldSublayerId = layers[i].id;
						var newFullId = newId + oldSublayerId.slice(oldId.length);
						layers[i].id = newFullId;
						layers[i]._titleForLegend = newFullId;
						manager.payload.map.emit('layerUpdated', {
							old_id: oldSublayerId,
							layer: layers[i]
						});
					}
				}
			};

			var syncSearchOptions = function () {
				// get current sources
				var sources = manager.data.utilities.search.get("sources");
				var searchIndex = -1;
				var changed = false;
				var layer;

				// loop through the overlays & features
				$.each(manager.overlays, function (index, overlay) {
					$.each(overlay.features, function (index2, feature) {
						layer = feature.esriObject;

						// if feature has params and defined searchOptions
						if (feature.params && feature.params.hasOwnProperty("searchOptions")) {
							if (layer.hasOwnProperty("searchOptions")) {
								searchIndex = sources.indexOf(layer.searchOptions);
							} else {
								searchIndex = -1;
							}

							// if hidden - remove from sources
							if (feature.isHidden && (searchIndex > -1)) {
								sources = sources.splice(searchIndex, 1);
								changed = true;
							}

							// if not hidden - verify and add to sources
							if (!feature.isHidden && (searchIndex === -1)) {
								var searchOptions = {};
								searchOptions.featureLayer = layer;
								searchOptions.placeholder = feature.params.searchOptions.placeholder;
								searchOptions.enableLabel = feature.params.searchOptions.enableLabel;
								searchOptions.searchFields = feature.params.searchOptions.searchFields;
								searchOptions.displayField = feature.params.searchOptions.displayField;
								searchOptions.exactMatch = feature.params.searchOptions.exactMatch;
								searchOptions.maxResults = feature.params.searchOptions.maxResults;
								searchOptions.outFields = feature.params.outFields;

								//if (feature.params.searchOptions.hasOwnProperty("infoTemplate")) {
								//	searchOptions.infoTemplate = new InfoTemplate(feature.params.searchOptions.infoTemplate[0], feature.params.searchOptions.infoTemplate[1]);
								//}

								layer.searchOptions = searchOptions;
								sources.push(searchOptions);

								changed = true;
							}
						}
					});
				});

				// if changed - update search
				if (changed) {
					manager.data.utilities.search.set("sources", sources);
					manager.data.utilities.search.startup();
				}
			};
		};

		return handler;
	});
