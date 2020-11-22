define(['esri/dijit/BasemapGallery'], function(EsriBasemapGallery) {
    var OVERLAY_PREF_NAMESPACE = 'com.esri';
    var OVERLAY_PREF_NAME = 'basemapSelection';
    var OVERLAY_PREF_NAME_FONT = 'basemapFontSelection';

    var BasemapGallery = function(params, srcNodeRef) {
        var basemapGallery;
        if(srcNodeRef) {
            basemapGallery = new EsriBasemapGallery(params, srcNodeRef);
        } else {
            basemapGallery = new EsriBasemapGallery(params);
        }

        basemapGallery.on('load', function() {
            var successHandler = function(retValue) {
                var basemap;

                if (retValue && retValue.value) {
                    basemap = JSON.parse(retValue.value);
                }

                basemapGallery.select(basemap);
            };

            var failureHandler = function(err) {
                console.log("Error in getting preference", err);
            };
            /*
            OWFWidgetExtensions.Preferences.getWidgetInstancePreference({
                namespace: OVERLAY_PREF_NAMESPACE,
                name: OVERLAY_PREF_NAME,
                onSuccess: successHandler,
                onFailure: failureHandler
            });
            */

            var successFontHandler = function(retValue) {
                var basemapFontColor = "Black;#000000";

                if (retValue && retValue.value) {
                    basemapFontColor = JSON.parse(retValue.value);
                }

                map.basemapFontColorRAW = basemapFontColor;
                map.basemapFontColor = basemapFontColor.split(";")[1];

                $("#basemapFontStyle option[value='"+ map.basemapFontColorRAW + "']").attr("selected", "selected");
              };
            /*
            OWFWidgetExtensions.Preferences.getWidgetInstancePreference({
                namespace: OVERLAY_PREF_NAMESPACE,
                name: OVERLAY_PREF_NAME_FONT,
                onSuccess: successFontHandler,
                onFailure: failureHandler
            });
            */
        });

        $("#basemapFontStyle").on("change", function() {
            let color = $('#basemapFontStyle').find(":selected").val();
            map.basemapFontColor = color.split(";")[1];

            var dataValue = JSON.stringify(color);
            /*
            OWFWidgetExtensions.Preferences.setWidgetInstancePreference({
                namespace: OVERLAY_PREF_NAMESPACE,
                name: OVERLAY_PREF_NAME_FONT,
                value: dataValue,
                onSuccess: null,
                onFailure: null
            });
            */
        });

        basemapGallery.on('selection-change', function(){
            var basemap = basemapGallery.getSelected();
            map.basemapCurrentTitle = basemap.title;
            if (!map.hasOwnProperty("basemapFontColor")) {
                map.basemapFontColor = "#000000";
            }
            // set the font color for basemaps
            if (map.hasOwnProperty("basemapFontColorRAW")) {
                $("#basemapFontStyle option[value='"+ map.basemapFontColorRAW + "']").attr("selected", "selected");
            }

            //archive basemap
            var successHandler = function() {
                graphics = map.graphicsLayerIds;
                for (i = 0; i < graphics.length; i++) {
                    graphicLayer = map.getLayer(graphics[i]);
                    graphicLayer.redraw();
                }
            };
            var failureHandler = function() {
                console.log ("Unable to archive state.");
            };

            var dataValue = JSON.stringify(basemap.id);
            /*
            OWFWidgetExtensions.Preferences.setWidgetInstancePreference({
                namespace: OVERLAY_PREF_NAMESPACE,
                name: OVERLAY_PREF_NAME,
                value: dataValue,
                onSuccess: successHandler,
                onFailure: failureHandler
            });
            */
        });

        basemapGallery.on("error", function(msg) {
          console.debug("basemap gallery error:  ", msg);
        });

        return basemapGallery;
    }

    return BasemapGallery;
});