// Setup dojo module loader for use with both ESRI JavaScript API and our
// local webapp files. This file MUST be included BEFORE dojo is loaded.
// NOTE: This webapp supports using the ESRI JavaScript in an "offline" mode
// wherein a local version can be bundled by the developer instead of
// referencing the files from the ESRI site. To enable "offline" mode:
// 1. Download the arcgis_js_v37_api.zip package from
// http://www.esri.com/apps/products/download.
// 2. Unzip and copy the contents of arcgis_js_api/library/3.7/3.7 to
// [webAppContext]/js/lib/esri-3.7.
// 3. Run the map webapp with "offline=true" set as a URL parameter.

// Define some global helper functions that can be used to set paths to the
// ESRI and OWF JavaScript files.
if (!window.isOffline) {
    /**
     * Determine if webapp is running in <b>offline</b> mode.
     * @global
     */
    window.isOffline = function () {
        // Test if "offline=true" was passed in URL
        return /.*offline\s*=\s*true.*/i.test(
            decodeURIComponent(window.location.search));
    }
}

if (!window.contextPath) {
    /**
     * Specifies absolute path to root of this webapp. Only works if the
     * JavaScript file defining this member is loaded by index.html (or
     * another file in the webapp root).
     * @global
     */
    window.contextPath = (function () {
        var loc = window.location;
        var path = loc.protocol + "//";

        if (loc.hostname) {
            path += loc.hostname;

            if (loc.port) {
                path += ":" + loc.port;
            }
        }

        path += loc.pathname;

        // Remove filename if present
        path = path.replace(/\/[^\/]+$/, "/");

        return path;
    })();
}

if (!window.esriJsPath) {
    /**
     * Specifies path to ESRI JavaScript API. Returns the location hosted on
     * the Internet by default. When isOffline() is true returns a location
     * hosted within this webapp.
     * @global
     */
    window.esriJsPath = (function () {
        // var path = "http://js.arcgis.com/3.23/";
        // var path = window.contextPath + "../vendor/js/esri_jsapi/";
        var path = "/esri_jsapi-3.35/";

        if (window.isOffline()) {
            // Use local copy of API files
            // path = window.contextPath + "../vendor/js/esri_jsapi/";
            path = "/esri_jsapi-3.35/";
        } else if (window.location.protocol != "file:") {
            // Match same protocol as page to avoid mixed content issues
            path = path.replace("http://", window.location.protocol + "//");
        }

        return path;
    })();
}

if (!window.esriGeometryService) {
    window.esriGeometryService = "//utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer";
}

if (!window.esriPrintService) {
    window.esriPrintService = "//sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
}

if (!window.esriWorldGeocoderService) {
    window.esriWorldGeocoderServiceFind = "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find";
    window.esriWorldGeocoderServiceCandidates = "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
}

/**
 * Dojo AMD loader configuration defined to allow ESRI libraries to be
 * loaded either from the Internet or within this webapp depending on the
 * value of isOffline().
 * @global
 */
window.esriDeployVer = "1.0.0";
window.esriDeployDate = "20201201";
window.esriUniversalName = "org.cmapi.esri";
window.esriInstanceName = window.esriUniversalName + "-" + (new Date().getTime().toString(16));
var dojoConfig = dojoConfig || {};

/* 20191029 - depreciated due to no license key
// added site keys
dojoConfig.siteKeys = {};
dojoConfig.siteKeys.BingMapsToken = "AhSZtOGb51X9fKt5KT8Cxi4CkcMIvPYei7QmT0plKbUuZLQjgCU3CUz-7eCaoR7y";
*/

// ESRI JavaScript API 3.7 does not load asynchronously
dojoConfig.async = false;
dojoConfig.cacheBust = "deployVer=" + window.esriDeployVer;

dojoConfig.has = {
    "esri-featurelayer-webgl": 1
};

dojoConfig.hasCache = {
    "config-selectorEngine": "acme",
    "config-tlmSiblingOfDojo": 1,
    "dojo-built": 1,
    "dojo-loader": 1,
    "dojo-undef-api": 0,
    dom: 1,
    "extend-esri": 1,
    "host-browser": 1
};

dojoConfig.packages = [
    // Required by ESRI and its bundled dojo
    {
        location: window.esriJsPath + "dojox",
        name: "dojox"
    },
    {
        location: window.esriJsPath + "dgrid",
        main: "OnDemandGrid",
        name: "dgrid"
    },
    {
        location: window.esriJsPath + "dijit",
        name: "dijit"
    },
    {
        location: window.esriJsPath + "xstyle",
        main: "css",
        name: "xstyle"
    },
    {
        location: window.esriJsPath + "esri",
        name: "esri"
    },
    {
        location: window.esriJsPath + "dojo",
        name: "dojo"
    },
    // Additional packages for this webapp
    {
        location: window.contextPath + "js",
        name: "app"
    },
    {
        location: window.contextPath + "vendor",
        name: "vendor"
    },
    {
        location: window.contextPath + "plugins",
        name: "plugins"
    },
    {
        location: window.contextPath + "interface",
        name: "interface"
    },
    {
        location: window.contextPath + "resource",
        name: "resource"
    }
];
