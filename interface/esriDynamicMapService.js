define(["esri/layers/ArcGISDynamicMapServiceLayer", "plugins/ViewUtilities"],
    function (ArcGISDynamicMapServiceLayer, ViewUtilities) {

        let esriDynamicMapService = function (global, service) {
            let self = this;
            self.map = global.plugins.extMap.instance;
			self.extNotify = global.plugins.extNotify;
            self.service = service;
            self.layer = null;

            self.init = function () {
                console.log("esriDynamicMapService - init");
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

				self.registerEvents();
			};

			self.registerEvents = function() {
                console.log("esriDynamicMapService - registerEvents");
				self.layer.on("load", function () {
					console.log("esriDynamicMapService - registerEvents/load");
					if (ViewUtilities.getBoolean(params.zoom)) {
						ViewUtilities.zoomToLayer(self.map, self.layer);
					}
				});

				self.layer.on("error", function ($event) {
					console.log("esriDynamicMapService - registerEvents/error");
                    if ($event.error.hasOwnProperty("code")) {
                        if (($event.error.code >= 400) && ($event.error.code < 600)) {
                            let msg = 'Unable to apply layer - ' + $event.error;
                            self.extNotify.errorNotifier(msg);
                        }
                    }
                });

                self.layer.on('visible-layers-change', function($event) {
					console.log("esriDynamicMapService - registerEvents/visible-layers-change");
                    self.remove();
                });
			};

            self.remove = function() {
                console.log("esriDynamicMapService - remove");
                console.log("... removed layer: " + self.service.text);
                self.map.removeLayer(self.layer);
             };

			 self.getExtent = function (featureId) {
                console.log("esriDynamicMapService - getExtent");
		
				if (self.layer && self.layer.fullExtent) {
					return self.layer.fullExtent;
				} else {
					return null;
				}
            };

            self.centerOnExtent = function (zoom) {
                console.log("esriDynamicMapService - centerOnExtent");

				if (self.layer && self.layer.fullExtent) {
					let extent = self.layer.fullExtent;

                    if (!JSUtilities.getBoolean(zoom) || (zoom === "auto")) {
                        self.extMap.handleSetExtent(extent, true);
                    } else {
                        self.extMap.handleCenterLocation(extent.getCenter());
                    }
				}
            };

            self.centerOnFeature = function (markerId, zoom) {
                console.log("esriDynamicMapService - centerOnFeature");

            };

            self.init();
        };

        return esriDynamicMapService;
    });