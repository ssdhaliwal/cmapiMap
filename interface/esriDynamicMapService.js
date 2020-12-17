define(["esri/layers/ArcGISDynamicMapServiceLayer", "plugins/ViewUtilities"],
    function (ArcGISDynamicMapServiceLayer, ViewUtilities) {

        let esriDynamicMapService = function (global, service) {
            let self = this;
            self.map = global.plugins.extMap.instance;
            self.search = global.plugins.extSearch;
			self.notify = global.plugins.extNotify;
			self.message = global.interfaces.messageService;
            self.service = service;
            self.layer = null;

            self.init = function () {
                console.log("... creating layer: " + self.service.text);
                let params = self.service.layer.params || {};
                let properties = self.service.layer.properties || {};
                self.layer = new ArcGISDynamicMapServiceLayer(properties.url, params);

				//Handle additional parameters
				if (params.dpi) {
					self.layer.setDPI(params.dpi);
				}
				if (params.disableClientCaching) {
					self.layer.setDisableClientCaching(params.disableClientCaching);
				}
				if (params.dynamicLayerInfos) {
					self.layer.setDynamicLayerInfos(params.dynamicLayerInfos);
				}
				if (params.imageFormat) {
					self.layer.setImageFormat(params.imageFormat);
				}
				if (params.imageTransparency) {
					self.layer.setImageTransparency(params.imageTransparency);
				}
				//if (params.infoTemplates) {
				//	self.layer.setInfoTemplates(params.infoTemplates);
				//}
				if (params.layerDefinitions) {
					self.layer.setLayerDefinitions(params.layerDefinitions);
				}
				if (params.layerDrawingOptions) {
					self.layer.setLayerDrawingOptions(params.layerDrawingOptions);
				}
				if (params.layerTimeOptions) {
					self.layer.setLayerDrawingOptions(params.layerTimeOptions);
				}
				if (params.maxScale) {
					self.layer.setMaxScale(params.maxScale);
				}
				if (params.minScale) {
					self.layer.setMinScale(params.minScale);
				}
				//if (params.opacity) {
				//	self.layer.setOpacity(params.opacity);
				//}
				//if (params.refreshInterval) {
				//	self.layer.RefreshInterval(params.refreshInterval);
				//}
				if (params.scaleRange) {
					self.layer.setScaleRange(params.scaleRange.minScale, params.scaleRange.maxRange);
				}
                //if (params.useMapTime) {
				//	self.layer.setUseMapTime(params.useMapTime);
				//}
				if (params.visibleLayers) {
					self.layer.setVisibleLayers(params.visibleLayers);
				}

				// remove token info before adding to the map
				// based on https://community.esri.com/message/91816/#comment-372370
				if (properties.url.indexOf("?") >= 0) {
					let lUrl = properties.url.substring(0, properties.url.indexOf("?"));
					let lUrlQuery = properties.url.substring(properties.url.indexOf("?") + 1, properties.url.length);
					let lQuery = ioQuery.queryToObject(lUrlQuery);
					delete lQuery.token;

					if ($.isEmptyObject(lQuery)) {
						self.layer.url = lUrl;
					} else {
						self.layer.url = lUrl + "?" + ioQuery.objectToQuery(lQuery);
					}
				}

				self.map.addLayer(self.layer);

                // add search options
                if (params.hasOwnProperty("searchOptions")) {
                    var searchOptions = {};
                    searchOptions.featureLayer = self.layer;
                    searchOptions.placeholder = params.searchOptions.placeholder;
                    searchOptions.enableLabel = params.searchOptions.enableLabel;
                    searchOptions.searchFields = params.searchOptions.searchFields;
                    searchOptions.displayField = params.searchOptions.displayField;
                    searchOptions.exactMatch = params.searchOptions.exactMatch;
                    searchOptions.maxResults = params.searchOptions.maxResults;
                    searchOptions.outFields = params.outFields;

                    //  if (params.searchOptions.hasOwnProperty("infoTemplate")) {
                    //      searchOptions.infoTemplate = new InfoTemplate(params.searchOptions.infoTemplate[0], params.searchOptions.infoTemplate[1]);
                    //  }

                    self.layer.searchOptions = searchOptions;
                    self.search.addSource(searchOptions);
                }

				self.registerEvents();
			};

			self.registerEvents = function() {
				self.layer.on("load", function () {
					if (ViewUtilities.getBoolean(params.zoom)) {
						ViewUtilities.zoomToLayer(self.map, self.layer);
					}
				});

				self.layer.on("error", function (e) {
                    if (e.error.hasOwnProperty("code")) {
                        if ((e.error.code >= 400) && (e.error.code < 600)) {
                            let msg = 'Unable to apply layer - ' + e.error;
                            self.notify.errorNotifier(msg);
                        }
                    }
                });

                self.layer.on('visible-layers-change', function(e) {
                    self.remove();
                });
			};

            self.remove = function() {
                console.log("... removed layer: " + self.service.text);
                if (self.layer.hasOwnProperty("searchOptions")) {
                    self.search.removeSource(self.layer.searchOptions);
                }
                self.map.removeLayer(self.layer);
             };

            self.init();
        };

        return esriDynamicMapService;
    });