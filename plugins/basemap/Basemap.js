define(["esri/dijit/BasemapGallery", "esri/dijit/BasemapLayer", "esri/dijit/Basemap", "plugins/ViewUtilities"],
    function (esriBasemapGallery, esriBasemapLayer, esriBasemap, ViewUtilties) {

        let extBasemap = function (global) {
            let self = this;
            let map = global.plugins.extMap.instance;
            self.instance = null;

            self.init = function () {
                self.instance = new esriBasemapGallery({
                    showArcGISBasemaps: true,
                    /* 20191029 - depreciated due to no license key
                    bingMapsKey: dojoConfig.siteKeys.BingMapsToken,
                    */
                    map: map
                },
                    "basemapGalleryDiv"
                );

                // added usgs basemaps for backup
                self.instance.add(
                    new esriBasemap({
                        "layers": [new esriBasemapLayer({
                            "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer"
                        })],
                        "title": "USGS Hydro Cached",
                        "itemId": "USCG001",
                        "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/info/thumbnail"
                    }));
                self.instance.add(
                    new esriBasemap({
                        "layers": [new esriBasemapLayer({
                            "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer"
                        })],
                        "title": "USGS Shaded Relief",
                        "itemId": "USCG002",
                        "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/info/thumbnail"
                    }));
                self.instance.add(
                    new esriBasemap({
                        "layers": [new esriBasemapLayer({
                            "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer"
                        })],
                        "title": "USGS ImageryOnly",
                        "itemId": "USCG003",
                        "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/info/thumbnail"
                    }));
                self.instance.add(
                    new esriBasemap({
                        "layers": [new esriBasemapLayer({
                            "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer"
                        })],
                        "title": "USGS Imagery Topo",
                        "itemId": "USCG004",
                        "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/info/thumbnail"
                    }));
                self.instance.add(
                    new esriBasemap({
                        "layers": [new esriBasemapLayer({
                            "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer"
                        })],
                        "title": "USGS Topo",
                        "itemId": "USCG005",
                        "thumbnailUrl": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/info/thumbnail"
                    }));
                self.instance.add(
                    new esriBasemap({
                        "layers": [new esriBasemapLayer({
                            "url": "https://10.50.193.71:6443/arcgis/rest/services/InternalBaseMap/MapServer"
                        })],
                        "title": "USCG FailSafe",
                        "itemId": "USCG006",
                        "thumbnailUrl": "/GlobalRepo/Images/Basemaps/basemap.png"
                    }));

                // added bing base maps
                /* 20191029 - depreciated due to no license key
                self.instance.add(
                  new esriBasemap({
                    "layers": [new esriBasemapLayer({ type: "BingMapsRoad" })],
                    "title": "Bing Road",
                    "itemId": "USCG006",
                    "id": "bmRoad",
                    "thumbnailUrl":"images/bing_streets.png"
                  }));
                  self.instance.add(
                    new esriBasemap({
                      "layers": [new esriBasemapLayer({ type: "BingMapsAerial" })],
                      "title": "Bing Aerial",
                      "itemId": "USCG007",
                      "id": "bmAerial",
                      "thumbnailUrl":"images/bing_aerial.png"
                    }));
                    self.instance.add(
                      new esriBasemap({
                        "layers": [new esriBasemapLayer({ type: "BingMapsHybrid" })],
                        "title": "Bing Aerial with labels",
                        "itemId": "USCG008",
                        "id": "bmHybrid",
                        "thumbnailUrl":"images/bing_aerial_hybrid.png"
                      }));
                */
                // added site verification
                ViewUtilties.isSiteOnline("https://www.arcgis.com", function (found) {
                    if (found) {
                        map.setBasemap("streets");
                    } else {
                        window.alert("Temporary ArcGIS service outage; alternate basemap set to USGS Topo.\n\n** This impacts REFERENCE/WEATHER services from ArcGIS.com; NOAA and other sites are not impacted. **\n\nIf no basemaps are available due to network outage; please use one of the three alternate options: (a) USCG Failsafe basemap, (b) USGS basemaps, or (c) Catalog Widget World Countries KML (REFERENCE -> BOUNDARIES).\n\nSee Alert Feed Widget for more details.");
                        let tBasemaps = self.instance.basemaps;
                        $.each(tBasemaps, function (index, item) {
                            if (item.title === "USGS Topo") {
                                let currBasemap = map.getLayer('basemap');
                                if (currBasemap) {
                                    map.removeLayer(currBasemap);
                                }

                                let newBasemap = new ArcGISTiledMapServiceLayer(item.layers[0].url, {
                                    "id": "basemap"
                                });
                                map.addLayer(newBasemap, 0);
                            }
                        });
                    }
                });

                self.instance.startup();
                self.registerEvents();
            };

            self.handleClick = function () {
                global.plugins.extToolbar.toggleOptions("#basemaps");

                if ($("#basemaps").hasClass("selected")) {
                    $("#basemaps_wrapper").css("display", "block");
                }
            };

            self.registerEvents = function() {
                $("#basemaps").on("click", self.handleClick);
            };

            self.init();
        };

        return extBasemap;
    });