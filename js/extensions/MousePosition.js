define(["esri/tasks/GeometryService", "esri/geometry/webMercatorUtils", "dojo/Deferred"],
    function (GeometryService, webMercatorUtils, Deferred) {
        /**
         * @constructor
         * @param map {object} ESRI map object for which this adapter should apply
         * @param status {module:cmwapi-adapter/Status}
         * @alias module:cmwapi-adapter/MousePosition
         */
        var MousePosition = function (map, status) {
            var me = this;
            me.coordinatesConversionType = "DMM";
            me.mapLastX = 0.00;
            me.mapLastY = 0.00;
            me.mapTitleUpdated = 0;
            me.latLonPosElement = $("#latlonpos");
            me.showCoordinatesTimeout = undefined;
            me.geometryService = new GeometryService(window.esriGeometryService);
            me.mgrsTimeout = undefined;
            var OVERLAY_PREF_NAMESPACE = 'com.esri';
            var OVERLAY_PREF_NAME = 'MapCoordinateFormat';
            /**
             * Get user preferences from owf.
             */
            /*
            OWFWidgetExtensions.Preferences.getWidgetInstancePreference({
                namespace: OVERLAY_PREF_NAMESPACE,
                name: OVERLAY_PREF_NAME,
                onSuccess: function (response) {
                    if (response && response.value) {
                        me.coordinatesConversionType = response.value;
                        status.setCoordinateFormat(me.coordinatesConversionType);
                    }
                }
            });
            */
            /** Subscribing the map status view channel to keep coordinate formats in sync. */
            /*
            OWF.Eventing.subscribe(Channels.MAP_STATUS_COORDINATE_FORMAT, function (sender, msg) {
                msg = JSON.parse(msg);
                me.setCoordinateFormat(msg.coordinateFormat);
            });
            */
            /**Sets the coordinate format to the new supplied format. */
            me.setCoordinateFormat = function (format) {
                if (me.coordinatesConversionType != format && format != undefined) {
                    me.coordinatesConversionType = format;
                    status.setCoordinateFormat(me.coordinatesConversionType);
                    me.showCoordinates(undefined);
                }
            };
            /**
             * Updates the lat lon view on the esri map with the current coordinate coversion type.
             */
            me.showCoordinates = function (evt) {
                // Debounce some request to prevent unnecessary dom refreshing.... But also make it responsive
                clearTimeout(me.showCoordinatesTimeout);
                clearTimeout(me.mgrsTimeout);

                me.showCoordinatesTimeout = setTimeout(function () {
                    if (evt) {
                        //the map is in web mercator but display coordinates in geographic (lat, lon)
                        var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);

                        //display mouse coordinates
                        me.mapLastX = mp.x.toFixed(5);
                        me.mapLastY = mp.y.toFixed(5);
                    }
                    switch (me.coordinatesConversionType) {
                        case "DMM":
                            me.latLonPosElement.text("(m" + window.cmwapiMapId + "/z" + map.getZoom() + ") [ lat: " + me.convertDecimalLatitudeToDMM(me.mapLastY) + ", lon: " + me.convertDecimalLongitudeToDMM(me.mapLastX) + " ]");
                            break;
                        case "DMS":
                            me.latLonPosElement.text("(m" + window.cmwapiMapId + "/z" + map.getZoom() + ") [ lat: " + me.convertDecimalLatitudeToDMS(me.mapLastY) + ", lon: " + me.convertDecimalLongitudeToDMS(me.mapLastX) + " ]");
                            break;
                        case "MGRS":
                            me.latLonPosElement.text("(m" + window.cmwapiMapId + "/z" + map.getZoom() + ") [ CALCULATING MGRS... ]");
                            me.mgrsTimeout = setTimeout(function () {
                                var params = {
                                    conversionType: "mgrs",
                                    coordinates: [
                                        [
                                            me.mapLastX,
                                            me.mapLastY
                                        ]
                                    ],
                                    sr: "4326"
                                };
                                var deferred = new Deferred();
                                me.geometryService.toGeoCoordinateString(params, function (result) {
                                    deferred.resolve(result);
                                }, function () {
                                    if (me.coordinatesConversionType === "MGRS") {
                                        me.latLonPosElement.text("(m" + window.cmwapiMapId + "/z" + map.getZoom() + ") [ ERROR ]");
                                    }
                                });
                                deferred.promise.then(function (response) {
                                    if (me.coordinatesConversionType === "MGRS") {
                                        me.latLonPosElement.text("(m" + window.cmwapiMapId + "/z" + map.getZoom() + ") [ " + response[0] + " ]");
                                    }
                                });
                            }, 700);
                            break;
                        default:
                            me.latLonPosElement.text("(m" + window.cmwapiMapId + "/z" + map.getZoom() + ") [ lat: " + me.mapLastY + ", lon: " + me.mapLastX + " ]");
                            break;
                    }
                }, 15);

                // id is undefined, then close widget
                // This should be refactored and moved elsewhere.
                /*
                if (!window.cmwapiMapId) {
                    setTimeout(function () {
                        var _WidgetStateController = Ozone.state.WidgetState.getInstance({
                            widgetEventingController: Ozone.eventing.Widget.getInstance(),
                            autoInit: true
                        });

                        _WidgetStateController.closeWidget();
                    }, 2500);
                    return;
                }

                if (me.mapTitleUpdated !== window.cmwapiMapId) {
                    me.mapTitleUpdated = window.cmwapiMapId;

                    OWF.Chrome.setTitle({
                        "title": "Esri Map - M" + window.cmwapiMapId
                    });
                }
                */
            };
            /**
             * Converts a decimal longitude to Degrees Minutes Minutes
             * @param {*} longitude
             */
            me.convertDecimalLongitudeToDMM = function (longitude) {
                var lon = Number(longitude);
                var dir = (lon >= 0 ? 'E' : 'W');
                lon = Math.abs(lon);
                var d = Math.floor(lon);
                var m = ((lon - d) * 60).toFixed(2);
                return d + '° ' + m + '\' ' + dir;
            };
            /**
             * Converts a decimal latitude to Degrees Minutes Minutes
             * @param {*} longitude
             */
            me.convertDecimalLatitudeToDMM = function (latitude) {
                var lat = Number(latitude);
                var dir = (lat >= 0 ? 'N' : 'S');
                lat = Math.abs(lat);
                var d = Math.floor(lat);
                var m = ((lat - d) * 60).toFixed(2);
                return d + '° ' + m + '\' ' + dir;
            };
            /**
             * Converts a decimal longitude to Degrees Minutes Seconds
             * @param {*} longitude
             */
            me.convertDecimalLongitudeToDMS = function (longitude) {
                var lon = Number(longitude);
                var dir = (lon >= 0 ? 'E' : 'W');
                lon = Math.abs(lon);
                var d = Math.floor(lon);
                var m = Math.floor((lon - d) * 60);
                var s = ((lon - d - (m / 60)) * 3600).toFixed(2);
                return d + '° ' + m + '\' ' + s + '" ' + dir;
            };
            /**
             * Converts a decimal latitude to Degrees Minutes Seconds
             * @param {*} longitude
             */
            me.convertDecimalLatitudeToDMS = function (latitude) {
                var lat = Number(latitude);
                var dir = (lat >= 0 ? 'N' : 'S');
                lat = Math.abs(lat);
                var d = Math.floor(lat);
                var m = Math.floor((lat - d) * 60);
                var s = ((lat - d - (m / 60)) * 3600).toFixed(2);
                return d + '° ' + m + '\' ' + s + '" ' + dir;
            };
            /**
             * Click handler for the lat long position element.
             */
            me.latLonPosElement.click(function () {
                if (me.coordinatesConversionType === "DMM") {
                    me.setCoordinateFormat("DMS");
                } else if (me.coordinatesConversionType === "DMS") {
                    me.setCoordinateFormat("DD");
                } else if (me.coordinatesConversionType === "DD") {
                    me.setCoordinateFormat("MGRS");
                } else {
                    me.setCoordinateFormat("DMM");
                }
                /*
                OWFWidgetExtensions.Preferences.setWidgetInstancePreference({
                    namespace: OVERLAY_PREF_NAMESPACE,
                    name: OVERLAY_PREF_NAME,
                    value: me.coordinatesConversionType
                });
                OWF.Eventing.publish(Channels.MAP_STATUS_COORDINATE_FORMAT, JSON.stringify({
                    coordinateFormat: me.coordinatesConversionType
                }));
                */
            });

        };
        return MousePosition;
    });