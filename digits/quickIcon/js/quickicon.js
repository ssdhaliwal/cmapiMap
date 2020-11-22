/**
 * @copyright USCG/S.Dhaliwal 2020/01/03
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
define(["dojo/_base/declare", "dojo/promise/all", "dojo/Deferred",
        "esri/request", "esri/tasks/GeometryService", "esri/geometry/coordinateFormatter", "app/JSUtils"
    ],
    function (declare, all, Deferred, esriRequest, GeometryService, coordinateFormatter, JSUtils) {
        return declare([], {
            findRowIndex: function (rowID) {
                var self = this;
                // console.log("+ findRowIndex", rowID);
                var rowData = {
                    index: -1,
                    data: null
                };

                self.QITable.rows().every(function (rowIdx, tableLoop, rowLoop) {
                    var data = this.data();

                    if (data.ID === rowID) {
                        rowData = {
                            index: rowIdx,
                            data: data
                        };
                        return false;
                    }
                });

                return rowData;
            },

            viewRow: function (rowID, zoom, hide) {
                var self = this;
                // console.log("+ viewRow", rowID, zoom, hide);
                self.blockingAction = true;

                var rowData = self.findRowIndex(rowID);

                // plot/replot the icon
                var overlayId = "Quick Icon";
                var featureId = rowData.data.Attributes.featureId;
                var name = rowData.data.Name;
                var zoom = (zoom || "center");

                var marker = {
                    id: featureId,
                    description: rowData.data.Description,
                    iconUrl: rowData.data.Icon,
                    latlon: {
                        lon: rowData.data.Coordinates.lon,
                        lat: rowData.data.Coordinates.lat
                    },
                    attributes: rowData.data.Attributes,
                    quickIcon: true,
                    iconSize: (rowData.data.Size || "small"),
                };

                if ((hide === undefined) || (hide === null)) {
                    this.overlayManager.feature.plotMarker(JSUtils.uuidv4(), overlayId, featureId, name, marker, zoom);
                } else {
                    this.overlayManager.feature.unplotMarker(JSUtils.uuidv4(), overlayId, featureId);
                }
            },

            editRow: function (rowID) {
                var self = this;
                // console.log("+ editRow", rowID);
                self.blockingAction = true;

                // swap the tooltip and editor divs
                $("#quickIcon-tooltip").css("display", "none");
                $("#quickIcon-editor").css("display", "block");

                $("#qiIPEditImages").append($("#qiPropertiesImages"));


                if (rowID) {
                    $("#qiIPEDITFormatType").val("DECIMAL").change();
                    var rowData = self.findRowIndex(rowID);

                    // show the current info for editing
                    $("#qiIPEditID").val(rowData.data.Attributes.featureId);
                    $("#qiIPEditName").val(rowData.data.Name);
                    $("#qiIPEditGroup").val(rowData.data.Group);
                    $("#qiIPEditOrignalName").val(rowData.data.Attributes.originalName);
                    $("#qiIPEditIcon").attr("src", rowData.data.Icon);
                    $("#qiIPEditComment").val(rowData.data.Description);
                    $("input[name='qiIPEditSize'][value='" + rowData.data.Size + "']").prop('checked', true);

                    // set lat/lon and coord format
                    var lat = Number(rowData.data.Coordinates.lat);
                    self.convertedLatLon.lat = lat;
                    lat = lat + ((lat >= 0) ? "N" : "S");
                    var lon = Number(rowData.data.Coordinates.lon);
                    self.convertedLatLon.lon = lon;
                    lon = lon + ((lat >= 0) ? "E" : "W");
                    $("#qiIPEDITCOORDDECIMAL01").val(lat);
                    $("#qiIPEDITCOORDDECIMAL02").val(lon);

                    self.plotTemporaryIcon({
                        key: "Enter"
                    }, null, null, null);
                } else {
                    $("#qiIPEDITFormatType").val("AUTO").change();

                    $("#qiIPEditID").val(new Date().getTime().toString(16));
                    $("#qiIPEditName").val("");
                    $("#qiIPEditGroup").val("n/a");
                    $("#qiIPEditOrignalName").val("{GN_QuickIcon}");
                    $("#qiIPEditIcon").attr("src", "/GlobalRepo/MapIcons/General/QuickIcon.png");
                    $("#qiIPEditComment").val("");
                    $("input[name='qiIPEditSize'][value='small']").prop('checked', true);

                    self.convertedLatLon.lat = 0.00;
                    self.convertedLatLon.lon = 0.00;
                }

                // show/hide the lat/lon edit fields
                //$("#qiIPEDITCOORD").css("display", "none");
                self.coordMapSelection(null, true);
                self.resetMessage();
            },

            deleteRow: function (rowID, accept) {
                var self = this;
                // console.log("+ deleteRow", rowID, accept);

                if (!accept) {
                    self.showModal("Delete selected item?", self.deleteRow.bind(self, rowID, true));
                } else {
                    self.hideModal();

                    self.blockingAction = true;
                    var rowData = self.findRowIndex(rowID);

                    // send message to map to remove the layer
                    /*
                    OWF.Eventing.publish("map.feature.unplot", JSON.stringify({
                        overlayId: "Quick Icon",
                        featureId: rowID
                    }));
                    */

                    self.QITable.row(rowData.index).remove().draw(true);
                    $("#qiIPIconMenuSave").css("background-color", "orange");
                }
            },

            hideItem: function (rowID) {
                var self = this;
                // console.log("+ hideItem", rowID);

                self.viewRow(rowID, "false", "true");
            },

            updateItem: function (marker, replot) {
                var self = this;
                // console.log("+ updateItem", marker, replot);

                var rowData = self.findRowIndex(marker.id);

                if (rowData.index < 0) {
                    self.QITable.row.add({
                        "ID": marker.attributes.featureId,
                        "Name": marker.attributes.name,
                        "Group": (marker.attributes.group || "n/a"),
                        "Date": marker.attributes.date,
                        "Description": marker.description,
                        "Icon": marker.iconUrl,
                        "Size": marker.iconSize,
                        "Attributes": marker.attributes,
                        "Coordinates": {
                            "lat": marker.latlon.lat,
                            "lon": marker.latlon.lon
                        }
                    }).draw(true);

                    // rescan the item and locate the rowdata
                    rowData = self.findRowIndex(marker.id);
                } else {
                    marker.attributes.date = new Date().toISOString();

                    rowData.data.Name = marker.attributes.name;
                    rowData.data.Group = (marker.attributes.group || "n/a");
                    rowData.data.Description = (marker.description || "");
                    rowData.data.Date = marker.attributes.date;
                    rowData.data.Size = marker.iconSize;

                    rowData.data.Attributes.group = rowData.data.Group;

                    // items from edit dialog (or) feature replot
                    if (marker.hasOwnProperty("latlon")) {
                        rowData.data.Coordinates = {
                            lat: marker.latlon.lat,
                            lon: marker.latlon.lon
                        }
                    }

                    // items from edit dialog (or) feature replot
                    if (marker.hasOwnProperty("iconUrl")) {
                        rowData.data.Icon = marker.iconUrl;
                        rowData.data.Attributes.originalName = marker.attributes.originalName;
                    }

                    self.QITable.row(rowData.index).data(rowData.data).draw(true);
                }

                if (replot) {
                    self.viewRow(marker.id, "false");
                }

                $("#qiIPIconMenuSave").css("background-color", "orange");
            },

            cleanupTempMarkers: function () {
                var self = this;
                // console.log("+ cleanupTempMarkers");

                self.QITable.rows().every(function (rowIdx, tableLoop, rowLoop) {
                    var data = this.data();

                    if (data.Name === "**TEMP-MARKER**") {
                        self.deleteRow(data.ID, true);
                    }
                });
            },

            tabClicked: function (event) {
                var self = this;
                // console.log("+ tabClicked", event);

                if (event.target.id === "qiIconMenuNew") {
                    $("#qiIconMenuHistory").removeClass("qiIconMenuHighlight");
                    $("#qiIconMenuNew").addClass("qiIconMenuHighlight");

                    document.getElementById("qiIconHistory").style.display = "none";
                    document.getElementById("qiIconProperties").style.display = "block";
                } else if (event.target.id === "qiIconMenuHistory") {
                    $("#qiIconMenuNew").removeClass("qiIconMenuHighlight");
                    $("#qiIconMenuHistory").addClass("qiIconMenuHighlight");

                    document.getElementById("qiIconProperties").style.display = "none";
                    document.getElementById("qiIconHistory").style.display = "block";
                } else if (event.target.id === "qiIPIconMenuAdd") {
                    self.editRow();
                } else if (event.target.id === "qiIPIconMenuSave") {
                    self.saveData();
                } else if (event.target.id === "qiIPIconMenuReload") {
                    self.restoreData();
                }
            },

            coordFormatTypeClicked: function (event) {
                var self = this;
                // console.log("+ coordFormatTypeClicked", event);

                var index = $("#qiIPEDITFormatType").val();

                // turn off all options
                $(".qiIPEDITCOORDS").css("display", "none");
                $("#qiIPEDITCOORDOTHERNAV").css("display", "none");

                // enable selected option
                if (index === "AUTO") {
                    if (!self.inputMask.auto) {
                        self.inputMask.auto = true;
                        $("#qiIPEDITCOORDAUTO01").inputmask({
                            regex: "[-+0-9. °'SN]*",
                            onKeyDown: self.plotTemporaryIcon.bind(self)
                        });
                        $("#qiIPEDITCOORDAUTO02").inputmask({
                            regex: "[-+0-9. °'EW]*",
                            onKeyDown: self.plotTemporaryIcon.bind(self)
                        });
                    }
                    $("#qiIPEDITCOORDAUTO").css("display", "block");
                } else if (index === "DECIMAL") {
                    if (!self.inputMask.dd) {
                        self.inputMask.dd = true;
                        $("#qiIPEDITCOORDDECIMAL01").inputmask("9{1,2}.9{1,8}(S|N)", {
                            onKeyDown: self.plotTemporaryIcon.bind(self)
                        });
                        $("#qiIPEDITCOORDDECIMAL02").inputmask("9{1,3}.9{1,8}(E|W)", {
                            onKeyDown: self.plotTemporaryIcon.bind(self)
                        });
                    }
                    $("#qiIPEDITCOORDDECIMAL").css("display", "block");
                } else if (index === "DDMGPS") {
                    if (!self.inputMask.ddm) {
                        self.inputMask.ddm = true;
                        $("#qiIPEDITCOORDDDM01").inputmask("9{1,2}° 9{1,2}.9{1,4}'(S|N)", {
                            onKeyDown: self.plotTemporaryIcon.bind(self)
                        });
                        $("#qiIPEDITCOORDDDM02").inputmask("9{1,3}° 9{1,2}.9{1,4}'(E|W)", {
                            onKeyDown: self.plotTemporaryIcon.bind(self)
                        });
                    }
                    $("#qiIPEDITCOORDDDMGPS").css("display", "block");
                } else if (index === "DMS") {
                    if (!self.inputMask.dms) {
                        self.inputMask.dms = true;
                        $("#qiIPEDITCOORDDMS01").inputmask("9{1,2}° 9{1,2}' 9{1,2}.9{1,2}\"(S|N)", {
                            onKeyDown: self.plotTemporaryIcon.bind(self)
                        });
                        $("#qiIPEDITCOORDDMS02").inputmask("9{1,3}° 9{1,2}' 9{1,2}.9{1,2}\"(E|W)", {
                            onKeyDown: self.plotTemporaryIcon.bind(self)
                        });
                    }
                    $("#qiIPEDITCOORDDMS").css("display", "block");
                } else {
                    if (!self.inputMask.other) {
                        self.inputMask.other = true;
                        $("#qiIPEDITCOORDOTHER01").on("keydown", self.plotTemporaryIcon.bind(self));
                    }
                    $("#qiIPEDITCOORDOTHER").css("display", "block");

                    if (index === "ADDRESS") {
                        $("#qiIPEDITCOORDOTHERNAV").css("display", "block");
                        $("#qiIPEDITCOORDOTHERNAVLBL").empty().append("0 of 0 (score: 0.00)");
                    }
                }
            },

            plotTemporaryIcon: function (event, buffer, caretPos, opt) {
                var self = this;
                // console.log("+ plotTemporaryIcon", event, buffer, caretPos, opt);
                var lat, lon, value, sepCount;

                /* event.target.id */
                if (event.key === "Enter") {
                    var index = $("#qiIPEDITFormatType").val();

                    if (index === "AUTO") {
                        lon = $("#qiIPEDITCOORDAUTO02").val();
                        lat = $("#qiIPEDITCOORDAUTO01").val();
                    } else if (index === "DECIMAL") {
                        lon = $("#qiIPEDITCOORDDECIMAL02").val();
                        lat = $("#qiIPEDITCOORDDECIMAL01").val();
                    } else if (index === "DDMGPS") {
                        lon = $("#qiIPEDITCOORDDDM02").val();
                        lat = $("#qiIPEDITCOORDDDM01").val();
                    } else if (index === "DMS") {
                        lon = $("#qiIPEDITCOORDDMS02").val();
                        lat = $("#qiIPEDITCOORDDMS01").val();
                    } else {
                        value = $("#qiIPEDITCOORDOTHER01").val()
                    }

                    if (index === "AUTO") {
                        // check if decimal (no spaces)
                        // check if ddm (one space)
                        // check if dms (two spaces)

                        // longitude
                        sepCount = (lon.match(/ /g) || []).length;
                        if (sepCount === 0) {
                            if (lon.includes("-") || lon.includes("W")) {
                                lon =  "-" + lon.replace("_", "").replace("W", "").replace("-", "");
                            } else {
                                lon = lon.replace("_", "").replace("E", "");
                            }
                        } else if (sepCount === 1) {
                            lon = JSUtils.convertDDMLongitudeToDD(lon.replace("_", ""));
                        } else if (sepCount === 2) {
                            lon = JSUtils.convertDMSLongitudeToDD(lon.replace("_", ""));
                        }

                        // latitude
                        sepCount = (lat.match(/ /g) || []).length;
                        if (sepCount === 0) {
                            if (lat.includes("-") || lat.includes("S")) {
                                lat =  "-" + lat.replace("_", "").replace("S", "").replace("-", "");
                            } else {
                                lat = lat.replace("_", "").replace("N", "");
                            }
                        } else if (sepCount === 1) {
                            lat = JSUtils.convertDDMLatitudeToDD(lat.replace("_", ""));
                        } else if (sepCount === 2) {
                            lat = JSUtils.convertDMSLatitudeToDD(lat.replace("_", ""));
                        }

                        self.convertedLatLon.lat = lat;
                        self.convertedLatLon.lon = lon;
                        self.plotTemporaryIconDeferred(lat, lon);
                    } else if (index === "DECIMAL") {
                        // fix lat/lon based on sign
                        if (lon.endsWith("_") || lon.endsWith("E")) {
                            lon = lon.replace("_", "").replace("E", "");
                        } else if (lon.includes("-")) {
                            lon =  "-" + lon.replace("_", "").replace("W", "").replace("-", "");
                        } else {
                            lon = "-" + lon.replace("_", "").replace("W", "");
                        }
                        if (lat.endsWith("_") || lat.endsWith("N")) {
                            lat = lat.replace("_", "").replace("N", "");
                        } else if (lat.includes("-")) {
                            lat =  "-" + lat.replace("_", "").replace("S", "").replace("-", "");
                        } else {
                            lat = "-" + lat.replace("_", "").replace("S", "");
                        }

                        self.convertedLatLon.lat = lat;
                        self.convertedLatLon.lon = lon;
                        self.plotTemporaryIconDeferred(lat, lon);
                    } else if (index === "DDMGPS") {
                        lat = JSUtils.convertDDMLatitudeToDD(lat.replace("_", ""));
                        lon = JSUtils.convertDDMLongitudeToDD(lon.replace("_", ""));

                        self.convertedLatLon.lat = lat;
                        self.convertedLatLon.lon = lon;
                        self.plotTemporaryIconDeferred(lat, lon);
                    } else if (index === "DMS") {
                        lat = JSUtils.convertDMSLatitudeToDD(lat.replace("_", ""));
                        lon = JSUtils.convertDMSLongitudeToDD(lon.replace("_", ""));

                        self.convertedLatLon.lat = lat;
                        self.convertedLatLon.lon = lon;
                        self.plotTemporaryIconDeferred(lat, lon);
                    } else if (index === "ADDRESS") {
                        var params = {
                            singleLine: value,
                            outFields: "Match_addr, Addr_type",
                            maxLocations: 20,
                            f: "json"
                        };

                        // make the esri call
                        var addressRequest = esriRequest({
                            url: window.esriWorldGeocoderServiceCandidates,
                            content: params,
                            callbackParamName: "callback"
                        });

                        addressRequest.then(function (response) {
                            // candidates.count, {address, location.x, location.y, score}
                            self.addressResults = response.candidates;
                            self.addressResultsPosition = 0;

                            // if there is data; then we show it
                            if (self.addressResults.length > 0) {
                                var nextAddress = self.addressResults[self.addressResultsPosition];
                                $("#qiIPEDITCOORDOTHERNAVLBL").empty().append((self.addressResultsPosition + 1) + " of " + self.addressResults.length + " (score: " + nextAddress.score + ")");

                                self.convertedLatLon.lat = nextAddress.location.y;
                                self.convertedLatLon.lon = nextAddress.location.x;
                                self.plotTemporaryIconDeferred(nextAddress.location.y, nextAddress.location.x, nextAddress.address);
                            } else {
                                $("#qiIPEDITCOORDOTHERNAVLBL").empty().append("0 of 0 (score: 0.00)");
                            }
                        }, function (error) {
                            self.showMessage(error, "warning");
                        });
                    } else {
                        // default params for service call
                        var params = {
                            conversionType: "",
                            conversionMode: "",
                            strings: [],
                            sr: "4326"
                        };

                        // add the value for conversion
                        params.strings.push(value.replace("_", ""));

                        // update conversionType and conversionMode
                        if (index === "GARS") {
                            params.conversionType = "GARS";
                            params.conversionMode = "garsCenter";
                        } else if (index === "GEOREF") {
                            params.conversionType = "GeoREF";
                        } else if (index === "UTM") {
                            params.conversionType = "UTM";
                            params.conversionMode = "utmDefault";
                        } else if (index === "USNG") {
                            params.conversionType = "USNG";
                        } else if (index === "MGRS") {
                            params.conversionType = "MGRS";
                            params.conversionMode = "mgrsDefault";
                        }

                        // make deferred call
                        var deferred = new Deferred();
                        self.geometryService.fromGeoCoordinateString(params, function (result) {
                            deferred.resolve(result);
                        }, function (error) {});
                        deferred.promise.then(function (response) {
                            self.convertedLatLon.lat = response[0]["1"];
                            self.convertedLatLon.lon = response[0]["0"];
                            self.plotTemporaryIconDeferred(response[0]["1"], response[0]["0"]);
                        });
                    }
                }
            },

            plotTemporaryIconDeferred: function (lat, lon, description) {
                var self = this;
                // console.log("+ plotTemporaryIconDeferred", lat, lon, description);

                if (!isNaN(lat) && !isNaN(lon)) {
                    // plot/replot the icon
                    var overlayId = "Quick Icon";
                    var featureId = $("#qiIPEditID").val();
                    var name = ($("#qiIPEditName").val() || "**TEMP-MARKER**");
                    var zoom = "center";

                    var marker = {
                        id: $("#qiIPEditID").val(),
                        name: $("#qiIPEditName").val(),
                        description: (description || $("#qiIPEditComment").val()),
                        iconUrl: $("#qiIPEditIcon").attr("src"),

                        attributes: {
                            date: new Date().toISOString(),
                            featureId: $("#qiIPEditID").val(),
                            group: $("#qiIPEditGroup").val(),
                            name: $("#qiIPEditName").val(),
                            originalName: $("#qiIPEditOrignalName").val(),
                            id: $("#qiIPEditID").val()
                        },
                        latlon: {
                            lon: lon,
                            lat: lat
                        },
                        quickIcon: true,
                        iconSize: $("input[name='qiIPEditSize']:checked").val()
                    };

                    self.overlayManager.feature.plotMarker(JSUtils.uuidv4(), overlayId, featureId, name, marker, zoom);
                }
            },

            coordMapSelection: function (event, reset) {
                var self = this;
                // console.log("+ coordMapSelection", event, reset);

                if (reset || $("#qiIPEDITCOORDCH").hasClass("qiMapSelectionOn")) {
                    $("#qiIPEDITCOORDCH").removeClass("qiMapSelectionOn");
                    $("#qiIPEDITCOORDCH").addClass("qiMapSelectionOff");
                } else {
                    $("#qiIPEDITCOORDCH").removeClass("qiMapSelectionOff");
                    $("#qiIPEDITCOORDCH").addClass("qiMapSelectionOn");
                }
            },

            coordAddressCandidates: function (event) {
                var self = this;
                // console.log("+ coordAddressCandidates", event);

                if (event.target.id === "qiIPEDITCOORDOTHERNAV01") {
                    if (self.addressResultsPosition > 0) {
                        self.addressResultsPosition--;
                    }

                    var nextAddress = self.addressResults[self.addressResultsPosition];
                    $("#qiIPEDITCOORDOTHERNAVLBL").empty().append((self.addressResultsPosition + 1) + " of " + self.addressResults.length + " (score: " + nextAddress.score + ")");

                    self.convertedLatLon.lat = nextAddress.location.y;
                    self.convertedLatLon.lon = nextAddress.location.x;
                    self.plotTemporaryIconDeferred(nextAddress.location.y, nextAddress.location.x, nextAddress.address);

                } else if (event.target.id === "qiIPEDITCOORDOTHERNAV02") {
                    if (self.addressResultsPosition < (self.addressResults.length - 1)) {
                        self.addressResultsPosition++;
                    }

                    var nextAddress = self.addressResults[self.addressResultsPosition];
                    $("#qiIPEDITCOORDOTHERNAVLBL").empty().append((self.addressResultsPosition + 1) + " of " + self.addressResults.length + " (score: " + nextAddress.score + ")");

                    self.convertedLatLon.lat = nextAddress.location.y;
                    self.convertedLatLon.lon = nextAddress.location.x;
                    self.plotTemporaryIconDeferred(nextAddress.location.y, nextAddress.location.x, nextAddress.address);
                }
            },

            showModal: function (message, callback) {
                var self = this;
                // console.log("+ showModal", message, callback);

                $("#qiModalMessage").empty().append(message);
                $(".qiModalAccept").off("click");
                $(".qiModalAccept").on("click", callback);

                $("#qiModal").css("display", "block");
            },

            hideModal: function () {
                $("#qiModal").css("display", "none");
                // console.log("+ hideModal");
            },

            showMessage: function (message, level) {
                var self = this;
                // console.log("+ showMessage", message, level);

                if (level === "error") {
                    $("#qiIPEDITERROR").addClass("errorLevel");
                } else if (level === "warning") {
                    $("#qiIPEDITERROR").addClass("warningLevel");
                    window.setTimeout(function () {
                        self.resetMessage();
                    }, 15000);
                } else if (level === "info") {
                    $("#qiIPEDITERROR").addClass("infoLevel");
                    window.setTimeout(function () {
                        self.resetMessage();
                    }, 5000);
                }

                $("#qiIPEDITERROR").css("display", "block");
                $("#qiIPEDITERROR").empty().append(message);
            },

            resetMessage: function () {
                var self = this;
                // console.log("+ resetMessage");

                $("#qiIPEDITERROR").css("display", "none");
                $("#qiIPEDITERROR").removeClass("errorLevel");
                $("#qiIPEDITERROR").removeClass("warningLevel");
                $("#qiIPEDITERROR").removeClass("infoLevel");
                $("#qiIPEDITERROR").empty();
            },

            loadIcons: function () {
                var self = this;
                // console.log("+ loadIcons");

                //The quickIcon html is populated from a template @ /feature/DrawTool/draw.html
                $("#quickIcon_wrapper").load("./digits/quickIcon/index.html", function () {
                    $("#qiIconMenuNew").on("click", self.tabClicked.bind(self));
                    $("#qiIconMenuHistory").on("click", self.tabClicked.bind(self));
                    $("#qiIPIconMenuAdd").on("click", self.tabClicked.bind(self));
                    $("#qiIPIconMenuReload").on("click", self.tabClicked.bind(self));
                    $("#qiIPIconMenuSave").on("click", self.tabClicked.bind(self));

                    $("#qiIPEDITFormatType").on("change", self.coordFormatTypeClicked.bind(self));
                    $("#qiIPEDITCOORDCH").on("click", self.coordMapSelection.bind(self));

                    $("#qiIPEDITCOORDOTHERNAV01").on("click", self.coordAddressCandidates.bind(self));
                    $("#qiIPEDITCOORDOTHERNAV02").on("click", self.coordAddressCandidates.bind(self));
                    $("#qiIPEDITCOORDOTHERNAVLBL").on("click", self.coordAddressCandidates.bind(self));

                    self.initializeTable();

                    // load the images
                    $("#qiPropertiesImages").load("./digits/quickIcon/images/imagelist.html", function () {
                        // connect the search event
                        $("#qiIPImageFilter").on("keyup", function () {
                            var val = $(this).val().trim();
                            val = val.replace(/\s+/g, '');

                            if (val.length >= 3) {
                                var searchItems = $("img[name*='" + val + "' i]");

                                $(".qiQuickIconImage").css("display", "none");
                                $.each(searchItems, function (index, element) {
                                    $(element).css("display", "unset");
                                });
                            } else if (val.length === 0) {
                                $(".qiQuickIconImage").css("display", "unset");
                            }
                        });

                        // connect the drag-drop from imagelist
                        $('.qiQuickIconImage').each(function (index, element) {
                            //add handler to update the image in the edit dialog
                            /*
                            owfdojo.connect(document.getElementById(element.id), 'click', this,
                                function (e) {
                                    e.preventDefault();

                                    $("#qiIPEditIcon").attr("src", element.src);
                                    $("#qiIPEditOrignalName").val("{" + element.name.replace("{", "").replace("}", "") + "}");
                                });
                            */
                            //add handler to text field for updating the icon and dragging
                            /*
                            owfdojo.connect(document.getElementById(element.id), 'onmousedown', this,
                                function (e) {
                                    e.preventDefault();

                                    let name = "{" + element.name.replace("{", "").replace("}", "") +
                                        "}";
                                    let sequence = new Date().getTime().toString(16);

                                    let marker = {};
                                    marker.id = sequence;
                                    marker.description = "";
                                    marker.iconUrl = element.src;
                                    marker.quickIcon = true;
                                    marker.iconSize = "small";
                                    marker.zoom = "false";

                                    marker.attributes = {
                                        date: new Date().toISOString(),
                                        featureId: sequence,
                                        group: "n/a",
                                        name: name,
                                        originalName: element.name
                                    };

                                    //OWF.DragAndDrop.startDrag({"dragDropData": {"overlayId": overlayId, "featureId": featureId, "name":"", "zoom":true, "marker": marker}});
                                    OWF.DragAndDrop.startDrag({
                                        "dragDropLabel": marker.attributes.name,
                                        "dragDropData": {
                                            "overlayId": "Quick Icon",
                                            "featureId": marker.attributes.featureId,
                                            "name": marker.attributes.name,
                                            "zoom": marker.zoom,
                                            "marker": marker
                                        }
                                    });
                                });
                                */
                            });
                    });
                });
            },

            checkData: function () {
                var self = this;
                // console.log("+ checkData");
                /*
                OWF.Preferences.getUserPreference({
                    namespace: "mil.uscg.cg1v.quickIcon",
                    name: "qi_header",
                    onSuccess: owfdojo.hitch(self, "onCheckDataSuccess"),
                    onFailure: owfdojo.hitch(self, "onCheckDataFailure")
                });
                */
            },

            onCheckDataSuccess: function (message) {
                var self = this;
                // console.log("+ onCheckDataSuccess", message);

                var data = JSON.parse(message.value);
                if (Object.keys(data).length > 0) {
                    setTimeout(self.restoreData.bind(self), 1000);
                }
            },

            onCheckDataFailure: function (errorMessage) {
                var self = this;
                // console.log("+ onCheckDataFailure", errorMessage);
            },

            saveData: function (accept) {
                var self = this;
                // console.log("+ saveData", accept);

                self.groups = {};
                self.itemList = [];

                if (!accept) {
                    self.showModal("Save current data?", self.saveData.bind(self, true));
                } else {
                    self.hideModal();

                    self.showMessage("save in progress...", "info");
                    self.QITable.rows().every(function (rowIdx, tableLoop, rowLoop) {
                        var data = this.data();
                        var group = data.Attributes.group;

                        // adjust the header trackers
                        self.itemList.push(data);
                        if (!self.groups.hasOwnProperty(group)) {
                            self.groups[group] = {
                                count: 1,
                                items: [data.ID]
                            }
                        } else {
                            if (self.groups[group].items.indexOf(data.ID) < 0) {
                                self.groups[group].count = self.groups[group].count + 1;
                                self.groups[group].items.push(data.ID);
                            }
                        }
                    });

                    // save the info header
                    /*
                    OWF.Preferences.setUserPreference({
                        namespace: "mil.uscg.cg1v.quickIcon",
                        name: "qi_header",
                        value: JSON.stringify(self.groups),
                        onSuccess: owfdojo.hitch(self, "onSaveDataSuccess", JSON.stringify(self.itemList)),
                        onFailure: owfdojo.hitch(self, "onSaveDataFailure")
                    });
                    */
                }
            },

            onSaveDataSuccess: function (data, message) {
                var self = this;
                // console.log("+ onSaveDataSuccess", data, message);

                if (data) {
                    // save the info data
                    /*
                    OWF.Preferences.setUserPreference({
                        namespace: "mil.uscg.cg1v.quickIcon",
                        name: "qi_data",
                        value: data,
                        onSuccess: owfdojo.hitch(self, "onSaveDataSuccess", ""),
                        onFailure: owfdojo.hitch(self, "onSaveDataFailure")
                    });
                    */
                } else {
                    $("#qiIPIconMenuSave").css("background-color", "");
                    self.showMessage("save successfull!", "info");
                }
            },

            onSaveDataFailure: function (errorMessage) {
                var self = this;
                // console.log("+ onSaveDataFailure", errorMessage);

                self.showMessage("error during save!", "error");
            },

            restoreData: function (accept) {
                var self = this;
                // console.log("+ restoreData", accept);

                if (!accept) {
                    self.showModal("Restore from last save?", self.restoreData.bind(self, true));
                } else {
                    self.hideModal();

                    // save the info data
                    self.showMessage("restore in progress...", "info");
                    /*
                    OWF.Preferences.getUserPreference({
                        namespace: "mil.uscg.cg1v.quickIcon",
                        name: "qi_header",
                        onSuccess: owfdojo.hitch(self, "onRestoreDataSuccess", "header"),
                        onFailure: owfdojo.hitch(self, "onRestoreDataFailure")
                    });
                    */
                }
            },

            onRestoreDataSuccess: function (data, message) {
                var self = this;
                // console.log("+ onRestoreDataSuccess", data, message);

                if (data) {
                    // save the info data
                    /*
                    OWF.Preferences.getUserPreference({
                        namespace: "mil.uscg.cg1v.quickIcon",
                        name: "qi_data",
                        onSuccess: owfdojo.hitch(self, "onRestoreDataSuccess", ""),
                        onFailure: owfdojo.hitch(self, "onRestoreDataFailure")
                    });
                    */
                } else {
                    var rows = JSON.parse(message.value);
                    $.each(rows, function (index, item) {
                        self.updateItem({
                            id: item.ID,
                            description: item.Description,
                            iconUrl: item.Icon,
                            iconSize: item.Size,
                            attributes: item.Attributes,
                            latlon: item.Coordinates
                        }, false);
                    });

                    $("#qiIPIconMenuSave").css("background-color", "");
                    self.showMessage("restore successfull!", "info");
                }
            },

            onRestoreDataFailure: function (errorMessage) {
                var self = this;
                // console.log("+ onRestoreDataFailure", errorMessage);

                self.showMessage("error during restore!", "error");
            },

            initializeTable: function () {
                var self = this;
                // console.log("+ initializeTable");

                // create and populate table
                self.QITable = $('#qiHistoryData').DataTable({
                    paging: false,
                    data: [],
                    columns: [{
                            'data': 'ID'
                        },
                        {
                            'data': 'Name'
                        },
                        {
                            'data': 'Group'
                        },
                        {
                            'data': 'Date'
                        },
                        {
                            'data': 'Description'
                        },
                        {
                            'data': 'Icon'
                        },
                        {
                            'data': 'Size'
                        },
                        {
                            'data': 'Attributes'
                        },
                        {
                            'data': 'Coordinates'
                        }
                    ],
                    columnDefs: [{
                        visible: false,
                        targets: [0, 2, 3, 4, 5, 6, 7, 8]
                    }, {
                        className: "dataTableColumnMin",
                        targets: [1]
                    }, {
                        render: function (data, type, row) {
                            return "<label style='margin: 0 0 0 0;' title='" + row.Description + "'>" + "<img src='" + row.Icon + "' style='margin: 0 0 0 0;' width='20' height='20'>" + "</label>&nbsp;" +
                                row.Name +
                                "</br>" +
                                "<span style='font-size: 8px;'>" + row.ID + "</span>" +
                                "<span style='float: right;'><a class='table-delete' href='#' onClick='javascript:map.QuickIcon.deleteRow(\"" +
                                row.ID + "\");return false;'>" +
                                "<img src='digits/quickIcon/icon/minus-circle.png' width='10' height='10'></a></span>" +
                                "<span style='float: right;'><a class='table-edit' href='#' onClick='javascript:map.QuickIcon.editRow(\"" +
                                row.ID + "\");return false;'>" +
                                "<img src='digits/quickIcon/icon/edit.png' width='12' height='12'></a></span>" +
                                "<span style='float: right;'><a class='table-view' href='#' onClick='javascript:map.QuickIcon.viewRow(\"" +
                                row.ID + "\");return false;'>" +
                                "<img src='digits/quickIcon/icon/eye.png' width='12' height='12'></a></span>";
                        },
                        targets: 1
                    }],
                    orderFixed: [
                        [2, 'asc']
                    ],
                    order: [
                        [2, 'asc'], [1, 'asc']
                    ],
                    rowGroup: {
                        dataSrc: 'Group'
                    }
                });

                // add click event to open details view
                $('#qiHistoryData tbody').on('click', 'td.dataTableColumnMin', function () {
                    var tr = $(this).closest('tr');
                    var row = self.QITable.row(tr);

                    if ((self.blockingAction) || (row.child.isShown())) {
                        self.blockingAction = false;

                        // This row is already open - close it
                        row.child.hide();
                        tr.removeClass('shown');
                    } else {
                        // create data to dispaly from row.data()
                        var tdData = '<table cellpadding="2px" cellspacing="0" border="0" style="padding-left:12px; width:100%;background-color:lightgoldenrodyellow;">' +
                            '<tr style="background-color: unset;">' +
                            '   <td colspan=2 style="padding:2px">' +
                            row.data().Description +
                            '   </td>' +
                            '</tr>' +
                            '<tr style="background-color: unset;">' +
                            '   <td style="padding:2px">Date</td>' +
                            '   <td style="padding:2px">' +
                            row.data().Date +
                            '   </td>' +
                            '</tr>' +
                            '<tr style="background-color: unset;">' +
                            '   <td style="padding:2px">Size</td>' +
                            '   <td style="padding:2px">' +
                            row.data().Size +
                            '   </td>' +
                            '</tr>' +
                            '<tr style="background-color: unset;">' +
                            '   <td style="padding:2px">Original Name</td>' +
                            '   <td style="padding:2px">' +
                            row.data().Attributes.originalName +
                            '   </td>' +
                            '</tr>' +
                            '</table>';

                        // Open this row
                        row.child(tdData).show();
                        tr.addClass('shown');
                    }
                });

                // wireup the editor click events
                $("#qiIPEditIconSelector").on("click", function (event) {
                    if ($("#qiIPEditImages").css("display") === "block") {
                        $("#qiIPEditImages").css("display", "none");
                    } else {
                        $("#qiIPEditImages").css("display", "block");
                    }
                });

                $('#qiIPEditDelete').on('click', function (event) {
                    // swap the tooltip and editor divs
                    $("#quickIcon-editor").css("display", "none");
                    $("#quickIcon-tooltip").css("display", "block");

                    // move image list back to the drag-drop
                    $("#qiIconProperties").append($("#qiPropertiesImages"));
                    self.coordMapSelection(null, true);

                    // get id and delete the record
                    var featureId = $("#qiIPEditID").val();
                    self.deleteRow(featureId, true);

                    // remove any temp markers
                    self.resetMessage();
                    self.cleanupTempMarkers();
                });
                $('#qiIPEditCancel').on('click', function (event) {
                    // swap the tooltip and editor divs
                    $("#quickIcon-editor").css("display", "none");
                    $("#quickIcon-tooltip").css("display", "block");

                    // move image list back to the drag-drop
                    $("#qiIconProperties").append($("#qiPropertiesImages"));
                    self.coordMapSelection(null, true);

                    // remove any temp markers
                    self.resetMessage();
                    self.cleanupTempMarkers();
                });
                $('#qiIPEditUpdate').on('click', function (event) {
                    // trigger event for the lat/lon to validate
                    //self.plotTemporaryIcon({key: "Enter"}, null, null, null);

                    // create json object for marker
                    var marker = {
                        id: $("#qiIPEditID").val(),
                        name: $("#qiIPEditName").val(),
                        description: $("#qiIPEditComment").val(),
                        iconUrl: $("#qiIPEditIcon").attr("src"),

                        attributes: {
                            featureId: $("#qiIPEditID").val(),
                            group: $("#qiIPEditGroup").val(),
                            name: $("#qiIPEditName").val(),
                            originalName: $("#qiIPEditOrignalName").val(),
                            id: $("#qiIPEditID").val()
                        },
                        latlon: {
                            lon: self.convertedLatLon.lon,
                            lat: self.convertedLatLon.lat
                        },
                        iconSize: $("input[name='qiIPEditSize']:checked").val()
                    };

                    // check if error, exit
                    if (!marker.name) {
                        self.showMessage("Name are required!", "error");
                        return false;
                    }
                    if (!marker.latlon.lat || !marker.latlon.lon ||
                        (marker.latlon.lat === 0.00) || (marker.latlon.lon === 0.00)) {
                        self.showMessage("Lat/Lon are required!", "error");
                        return false;
                    }

                    // swap the tooltip and editor divs
                    $("#quickIcon-editor").css("display", "none");
                    $("#quickIcon-tooltip").css("display", "block");

                    // move image list back to the drag-drop
                    $("#qiIconProperties").append($("#qiPropertiesImages"));
                    self.coordMapSelection(null, true);

                    self.updateItem(marker, true);

                    // remove any temp markers
                    self.resetMessage();
                    self.cleanupTempMarkers();
                });

                // setup modal dialog
                $(".qiModalClose").on("click", self.hideModal.bind(self));
                self.checkData();
            },

            constructor: function (args) {
                // console.log("+ constructor", args);
                declare.safeMixin(this, args);

                // properties
                this.blockingAction = false;
                this.dragging = false;
                this.QITable = null;
                this.inputMask = {};
                this.convertedLatLon = {
                    lat: 0.00,
                    lon: 0.00
                }
                this.addressResults = [];
                this.addressResultsPosition = 0;
                this.groups = {};

                this.geometryService = new GeometryService(window.esriGeometryService);

                // Get the element with id="defaultOpen" and click on it
                var self = this;
                window.setTimeout(function () {
                    self.loadIcons();
                }, 1000);
            }
        });
    });