define([],
    function () {

        var JSUtilities = {
            getBoolean: function (value) {
                // // console.log("JSUtilities - getBoolean");
                // empty/null match
                if ((value === null) || (value === undefined) || (value === NaN)) {
                    return false;
                }

                // match native value
                if (typeof value === "number") {
                    if (value <= 0) {
                        return false;
                    } else {
                        return true;
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

                // return false
                return false;
            },

            numberToHex: function (value) {
                // // console.log("JSUtilities - numberToHex");
                var hex = Number(value).toString(16);
                return (hex.length < 2) ? "0" + hex : hex;
            },

            getRandomColor: function (color) {
                // // console.log("JSUtilities - getRandomColor");
                let aa = "ff";
                let bb = "ff";
                let gg = "ff";
                let rr = "ff";

                if (Array.isArray(color)) {
                    if (color.length === 4) {
                        color = this.numberToHex(color[0]) + this.numberToHex(color[1]) + this.numberToHex(color[2]) + this.numberToHex(color[3]);
                    } else if (color.length === 3) {
                        color = this.numberToHex(color[0]) + this.numberToHex(color[1]) + this.numberToHex(color[2]) + "ff";
                    }
                } else if (typeof color === "object") {
                    if (('r' in color) && ('g' in color) && ('b' in color) && !('a' in color)) {
                        color = this.numberToHex(color.r) + this.numberToHex(color.g) + this.numberToHex(color.b) + "ff";
                    } else if (('r' in color) && ('g' in color) && ('b' in color) && ('a' in color)) {
                        color = this.numberToHex(color.r) + this.numberToHex(color.g) + this.numberToHex(color.b) + this.numberToHex(color.a);
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
                // // console.log("JSUtilities - colorShadeBlendConvert");
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
                // // console.log("JSUtilities - isSiteOnline");
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

            coordinate2Decimal: function (lat, lon) {
                var sepCount;

                // longitude
                sepCount = (lon.match(/ /g) || []).length;
                if (sepCount === 0) {
                    if (lon.includes("-") || lon.includes("W")) {
                        lon = "-" + lon.replace("_", "").replace("W", "").replace("-", "");
                    } else {
                        lon = lon.replace("+", "").replace("_", "").replace("E", "");
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
                        lat = "-" + lat.replace("_", "").replace("S", "").replace("-", "");
                    } else {
                        lat = lat.replace("+", "").replace("_", "").replace("N", "");
                    }
                } else if (sepCount === 1) {
                    lat = JSUtils.convertDDMLatitudeToDD(lat.replace("_", ""));
                } else if (sepCount === 2) {
                    lat = JSUtils.convertDMSLatitudeToDD(lat.replace("_", ""));
                }

                return { "lon": lon, "lat": lat };
            },

            coordinate2DDM: function (lat, lon) {
                var ddmLat = JSUtils.convertDDLatitudeToDDM(lat);
                var ddmLon = JSUtils.convertDDLongitudeToDDM(lon);

                return { "lon": ddmLon, "lat": ddmLat };
            },

            coordinate2DMS: function (lat, lon) {
                var ddmLat = JSUtils.convertDDLatitudeToDMS(lat);
                var ddmLon = JSUtils.convertDDLongitudeToDMS(lon);

                return { "lon": ddmLon, "lat": ddmLat };
            },

            convertDDToDDM: function (latitude, longitude) {
                return this.convertDDLatitudeToDDM(latitude) + ", " +
                    this.convertDDLongitudeToDDM(longitude);
            },

            convertDDLongitudeToDDM: function (longitude) {
                var lon = 0.00;

                longitude = longitude + "";
                if (longitude.includes("-") || longitude.includes("W") || longitude.includes("w")) {
                    try {
                        lon = -1 * Number(longitude.replace(/[-W]/gi, ""));
                    } catch { lon = 0; }
                    dir = "W";
                } else {
                    try {
                        lon = Number(longitude.replace(/[+E]/gi, ""));
                    } catch { lon = 0; }
                    dir = "E";
                }

                lon = Math.abs(lon);
                var d = Math.floor(lon);
                var m = ((lon - d) * 60);
                return d + ' ' + m + dir;
            },

            convertDDLatitudeToDDM: function (latitude) {
                var lat = 0.00;

                latitude = latitude + "";
                if (latitude.includes("-") || latitude.includes("S") || latitude.includes("s")) {
                    try {
                        lat = -1 * Number(latitude.replace(/[-S]/gi, ""));
                    } catch { lat = 0; }
                    dir = "S";
                } else {
                    try {
                        lat = Number(latitude.replace(/[+N]/gi, ""));
                    } catch { lat = 0; }
                    dir = "N";
                }

                lat = Math.abs(lat);
                var d = Math.floor(lat);
                var m = ((lat - d) * 60);
                return d + ' ' + m + dir;
            },

            convertDDToDMS: function (latitude, longitude) {
                return this.convertDDLatitudeToDMS(latitude) + ", " +
                    this.convertDDLongitudeToDMS(longitude);
            },

            convertDDLongitudeToDMS: function (longitude) {
                var lon = 0.00;

                longitude = longitude + "";
                if (longitude.includes("-") || longitude.includes("W") || longitude.includes("w")) {
                    try {
                        lon = -1 * Number(longitude.replace(/[-W]/gi, ""));
                    } catch { lon = 0; }
                    dir = "W";
                } else {
                    try {
                        lon = Number(longitude.replace(/[+E]/gi, ""));
                    } catch { lon = 0; }
                    dir = "E";
                }

                lon = Math.abs(lon);
                var d = Math.floor(lon);
                var m = Math.floor((lon - d) * 60);
                var s = ((lon - d - (m / 60)) * 3600);
                return d + ' ' + m + ' ' + s + dir;
            },

            convertDDLatitudeToDMS: function (latitude) {
                var lat = 0.00;

                latitude = latitude + "";
                if (latitude.includes("-") || latitude.includes("S") || latitude.includes("s")) {
                    try {
                        lat = -1 * Number(latitude.replace(/[-S]/gi, ""));
                    } catch { lat = 0; }
                    dir = "S";
                } else {
                    try {
                        lat = Number(latitude.replace(/[+N]/gi, ""));
                    } catch { lat = 0; }
                    dir = "N";
                }

                lat = Math.abs(lat);
                var d = Math.floor(lat);
                var m = Math.floor((lat - d) * 60);
                var s = ((lat - d - (m / 60)) * 3600);
                return d + ' ' + m + ' ' + s + dir;
            },

            convertDMSToDD: function (latitude, longitude) {
                return this.convertDMSLatitudeToDD(latitude) + ", " +
                    this.convertDMSLongitudeToDD(longitude);
            },

            convertDMSToDDM: function (latitude, longitude) {
                return this.convertDDLatitudeToDDM(this.convertDMSLatitudeToDD(latitude)) + ", " +
                    this.convertDDLongitudeToDDM(this.convertDMSLongitudeToDD(longitude))
            },

            convertDMSLongitudeToDD: function (longitude) {
                var dms = longitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = 0;
                try {
                    d = Number(dms[0]);
                } catch { d = 0; }
                if (d < 0) d = d * -1;

                var m = 0;
                try {
                    m = Number(dms[1]);
                } catch { m = 0; }
                var s = 0;
                try {
                    s = Number(dms[2].replace(/[EW]/gi, ""));
                } catch { s = 0; }

                var dir = "+";
                if (longitude.includes("-") || longitude.includes("W") || longitude.includes("w")) {
                    dir = "-";
                }

                var dm = m + (s / 60);
                var dd = ((dir === "-") ? -1 : 1) * (d + (dm / 60));
                return dd;
            },

            convertDMSLatitudeToDD: function (latitude) {
                var dms = latitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = 0;
                try {
                    d = Number(dms[0]);
                } catch { d = 0; }
                if (d < 0) d = d * -1;

                var m = 0;
                try {
                    m = Number(dms[1]);
                } catch { m = 0; }
                var s = 0;
                try {
                    s = Number(dms[2].replace(/[NS]/gi, ""));
                } catch { s = 0; }

                var dir = "+";
                if (latitude.includes("-") || latitude.includes("S") || latitude.includes("s")) {
                    dir = "-";
                }

                var dm = m + (s / 60);
                var dd = ((dir === "-") ? -1 : 1) * (d + (dm / 60));
                return dd;
            },

            convertDDMToDD: function (latitude, longitude) {
                return this.convertDDMLatitudeToDD(latitude) + ", " +
                    this.convertDDMLongitudeToDD(longitude);
            },

            convertDDMToDMS: function (latitude, longitude) {
                return this.convertDDLatitudeToDMS(this.convertDDMLatitudeToDD(latitude)) + ", " +
                    this.convertDDLongitudeToDMS(this.convertDDMLongitudeToDD(longitude))
            },

            convertDDMLongitudeToDD: function (longitude) {
                var ddm = longitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = 0;
                try {
                    d = Number(ddm[0]);
                } catch { d = 0; }
                if (d < 0) d = d * -1;

                var m = 0;
                try {
                    m = Number(ddm[1].replace(/[EW]/gi, ""));
                } catch { m = 0; }

                var dir = "+";
                if (longitude.includes("-") || longitude.includes("W") || longitude.includes("w")) {
                    dir = "-";
                }

                var dd = ((dir === "-") ? -1 : 1) * (d + (m / 60));
                return dd;
            },

            convertDDMLatitudeToDD: function (latitude) {
                var ddm = latitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = 0;
                try {
                    d = Number(ddm[0]);
                } catch { d = 0; }
                if (d < 0) d = d * -1;

                var m = 0;
                try {
                    m = Number(ddm[1].replace(/[NS]/gi, ""));
                } catch { m = 0; }

                var dir = "+";
                if (latitude.includes("-") || latitude.includes("S") || latitude.includes("s")) {
                    dir = "-";
                }

                var dd = ((dir === "-") ? -1 : 1) * (d + (m / 60));
                return dd;
            },

            // Changes XML to JSON
            xmlToJson: function (xml) {
                // // console.log("JSUtilities - xmlToJson");
                // Create the return object
                // Create the return object
                let obj = {};

                if (xml.nodeType === 1) { // element
                    // do attributes
                    let aLength = xml.attributes.length;
                    if (aLength > 0) {
                        obj["attributes"] = {};
                        for (let j = 0; j < aLength; j++) {
                            let attribute = xml.attributes.item(j);
                            obj["attributes"][attribute.nodeName] = attribute.nodeValue;
                        }
                    }
                } else if (xml.nodeType === 3) { // text
                    obj = xml.nodeValue;
                }

                if (xml && xml.hasChildNodes()) {
                    let cLength = xml.childNodes.length;
                    for (let i = 0; i < cLength; i++) {
                        let item = xml.childNodes.item(i);
                        let nodeName = item.nodeName;

                        if (typeof (obj[nodeName]) === "undefined") {
                            let value = this.xmlToJson(item);
                            if (typeof value === "string") {
                                value = value.trim();
                            }

                            if (value) {
                                if (value.hasOwnProperty("#text")) {
                                    value = value["#text"];
                                }
                                obj[nodeName] = value;
                            }
                        } else {
                            if (typeof (obj[nodeName].push) === "undefined") {
                                let old = obj[nodeName];
                                obj[nodeName] = [];
                                obj[nodeName].push(old);
                            }

                            let value = this.xmlToJson(item);
                            obj[nodeName].push(value);
                        }
                    }
                }

                return obj;
            },

            // https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
            // Version 4.0
            colorShadeBlendConvert: function (percent, fromColor, toColor, linear) {
                // // console.log("JSUtilities - colorShadeBlendConvert");
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
                // // console.log("JSUtilities - csv2Array");
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

            tryJSONParse(value) {
                // // console.log("JSUtilities - tryJSONParse");
                let json = null;

                try {
                    if (typeof value === 'string') {
                        json = JSON.parse(value);
                    } else json = value;
                } catch (exception) {
                    console.log("JSON parse error/" + exception + "/" + value);
                    json = null;
                }
                return json;
            },

            hex2Int(hex) {
                // // console.log("JSUtilities - hex2Int");
                return parseInt(hex, 16);
            },

            int2Hex(number) {
                // // console.log("JSUtilities - int2Hex");
                return number.toString(16);
            },

            hex2Str(hex) {
                // // console.log("JSUtilities - hex2Str");
                let str = "";

                try {
                    str = decodeURIComponent(hex.replace(/(..)/g, '%$1'))
                }
                catch (exception) {
                    str = hex
                }
                return str
            },

            str2Hex: function (str) {
                // // console.log("JSUtilities - str2Hex");
                let hex = "";

                try {
                    hex = unescape(encodeURIComponent(str))
                        .split('').map(function (v) {
                            return v.charCodeAt(0).toString(16).padStart(2, '0')
                        }).join('')
                }
                catch (exception) {
                    hex = str
                }
                return hex
            },

            isEmpty: function (value) {
                // // console.log("JSUtilities - isEmpty");
                let result = true;

                if (typeof str === "string") {
                    if (value.trim().length > 0) {
                        result = false;
                    }
                } else if (typeof value === "object") {
                    if (Object.keys(value).length > 0) {
                        result = false;
                    }
                } else if (Array.isArray(value)) {
                    if (value.length > 0) {
                        result = false;
                    }
                } else if ((value !== undefined) || (value !== null)) {
                    result = false;
                }

                return result;
            }
        };

        return JSUtilities;
    });
