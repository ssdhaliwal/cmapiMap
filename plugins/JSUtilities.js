define([],
    function () {

        var JSUtilities = {
            getBoolean: function (value) {
                // empty/null match
                if ((value === null) || (value === undefined) || (value === NaN)) {
                    return false;
                }

                // match native value
                if (typeof value === "number") {
                    switch (value) {
                        case 0: case false: return false;
                        default: return true;
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
            },

            _numberToHex: function (value) {
                var hex = Number(value).toString(16);
                return (hex.length < 2) ? "0" + hex : hex;
            },

            getRandomColor: function (color) {
                let aa = "ff";
                let bb = "ff";
                let gg = "ff";
                let rr = "ff";

                if (Array.isArray(color)) {
                    if (color.length === 4) {
                        color = this._numberToHex(color[0]) + this._numberToHex(color[1]) + this._numberToHex(color[2]) + this._numberToHex(color[3]);
                    } else if (color.length === 3) {
                        color = this._numberToHex(color[0]) + this._numberToHex(color[1]) + this._numberToHex(color[2]) + "ff";
                    }
                } else if (typeof color === "object") {
                    if (('r' in color) && ('g' in color) && ('b' in color) && !('a' in color)) {
                        color = this._numberToHex(color.r) + this._numberToHex(color.g) + this._numberToHex(color.b) + "ff";
                    } else if (('r' in color) && ('g' in color) && ('b' in color) && ('a' in color)) {
                        color = this._numberToHex(color.r) + this._numberToHex(color.g) + this._numberToHex(color.b) + this._numberToHex(color.a);
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

            convertDDToDDM: function (latitude, longitude) {
                return convertDDLatitudeToDDM(latitude) + ", " +
                    convertDDLongitudeToDDM(longitude);
            },

            convertDDLongitudeToDDM: function (longitude) {
                var lon = Number(longitude);
                var dir = (lon >= 0 ? 'E' : 'W');
                lon = Math.abs(lon);
                var d = Math.floor(lon);
                var m = ((lon - d) * 60).toFixed(4);
                return d + '° ' + m + '\' ' + dir;
            },

            convertDDLatitudeToDDM: function (latitude) {
                var lat = Number(latitude);
                var dir = (lat >= 0 ? 'N' : 'S');
                lat = Math.abs(lat);
                var d = Math.floor(lat);
                var m = ((lat - d) * 60).toFixed(4);
                return d + '° ' + m + '\' ' + dir;
            },

            convertDDToDMS: function (latitude, longitude) {
                return convertDDLatitudeToDMS(latitude) + ", " +
                    convertDDLongitudeToDMS(longitude);
            },

            convertDDLongitudeToDMS: function (longitude) {
                var lon = Number(longitude);
                var dir = (lon >= 0 ? 'E' : 'W');
                lon = Math.abs(lon);
                var d = Math.floor(lon);
                var m = Math.floor((lon - d) * 60);
                var s = ((lon - d - (m / 60)) * 3600).toFixed(2);
                return d + '° ' + m + '\' ' + s + '" ' + dir;
            },

            convertDDLatitudeToDMS: function (latitude) {
                var lat = Number(latitude);
                var dir = (lat >= 0 ? 'N' : 'S');
                lat = Math.abs(lat);
                var d = Math.floor(lat);
                var m = Math.floor((lat - d) * 60);
                var s = ((lat - d - (m / 60)) * 3600).toFixed(2);
                return d + '° ' + m + '\' ' + s + '" ' + dir;
            },

            convertDMSToDD: function (latitude, longitude) {
                return convertDMSLatitudeToDD(latitude) + ", " +
                    convertDMSLongitudeToDD(longitude);
            },

            convertDMSToDDM: function (latitude, longitude) {
                return convertDDLatitudeToDDM(convertDMSLatitudeToDD(latitude)) + ", " +
                    convertDDLongitudeToDDM(convertDMSLongitudeToDD(longitude))
            },

            convertDMSLongitudeToDD: function (longitude) {
                var dms = longitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = Number(dms[0]);
                if (d < 0) d = d * -1;

                var m = Number(dms[1]);
                var s = Number(dms[2].replace(/[EW]/gi, ""));

                var dir = "+";
                if (longitude.includes("-") || longitude.includes("W")) {
                    dir = "-";
                }

                var dm = m + (s / 60);
                var dd = ((dir === "-") ? -1 : 1) * (d + (dm / 60));
                return dd;
            },

            convertDMSLatitudeToDD: function (latitude) {
                var dms = latitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = Number(dms[0]);
                if (d < 0) d = d * -1;

                var m = Number(dms[1]);
                var s = Number(dms[2].replace(/[NS]/gi, ""));

                var dir = "+";
                if (latitude.includes("-") || latitude.includes("S")) {
                    dir = "-";
                }

                var dm = m + (s / 60);
                var dd = ((dir === "-") ? -1 : 1) * (d + (dm / 60));
                return dd;
            },

            convertDDMToDD: function (latitude, longitude) {
                return convertDDMLatitudeToDD(latitude) + ", " +
                    convertDDMLongitudeToDD(longitude);
            },

            convertDDMToDMS: function (latitude, longitude) {
                return convertDDLatitudeToDMS(convertDDMLatitudeToDD(latitude)) + ", " +
                    convertDDLongitudeToDMS(convertDDMLongitudeToDD(longitude))
            },

            convertDDMLongitudeToDD: function (longitude) {
                var ddm = longitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = Number(ddm[0]);
                if (d < 0) d = d * -1;

                var m = Number(ddm[1].replace(/[EW]/gi, ""));

                var dir = "+";
                if (longitude.includes("-") || longitude.includes("W")) {
                    dir = "-";
                }

                var dd = ((dir === "-") ? -1 : 1) * (d + (m / 60));
                return dd;
            },

            convertDDMLatitudeToDD: function (latitude) {
                var ddm = latitude.replace(/[^-\. 0-9a-z]/gi, '').split(" ");
                var d = Number(ddm[0]);
                if (d < 0) d = d * -1;

                var m = Number(ddm[1].replace(/[NS]/gi, ""));

                var dir = "+";
                if (latitude.includes("-") || latitude.includes("S")) {
                    dir = "-";
                }

                var dd = ((dir === "-") ? -1 : 1) * (d + (m / 60));
                return dd;
            },

            // Changes XML to JSON
            xmlToJson: function (xml) {
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
            }
        };

        return JSUtilities;
    });
