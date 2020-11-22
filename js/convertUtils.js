define([], function () {

    var ConvertUtils = (function () {
        var self = this;
    });

    ConvertUtils.prototype.toDMM = function (coordinate) {
        var self = this;

        var absolute = Math.abs(coordinate);
        var degrees = Math.floor(absolute);
        var minutesNotTruncated = (absolute - degrees) * 60;
        var minutes = Math.floor(minutesNotTruncated);
        var dmins = Math.floor((minutesNotTruncated - minutes) * 60) / 60;

        return degrees + "-" + minutes + "-" + dmins;
    };

    ConvertUtils.prototype.latlon2DMM = function (coordinates) {
        var self = this;

        var parts = coordinates.split(",");
        var latitude = self.toDMM(parts[0]);
        var latitudeCardinal = Math.sign(parts[0]) >= 0 ? "N" : "S";

        var longitude = self.toDMM(parts[1]);
        var longitudeCardinal = Math.sign(parts[2]) >= 0 ? "E" : "W";

        return latitude + " " + latitudeCardinal + "," + longitude + " " + longitudeCardinal;
    };

    ConvertUtils.prototype.toDMS = function (coordinate) {
        var self = this;

        var absolute = Math.abs(coordinate);
        var degrees = Math.floor(absolute);
        var minutesNotTruncated = (absolute - degrees) * 60;
        var minutes = Math.floor(minutesNotTruncated);
        var seconds = Math.floor((minutesNotTruncated - minutes) * 60);

        return degrees + "°" + minutes + "'" + seconds + '"';
    };

    ConvertUtils.prototype.latlon2DMS = function (coordinates) {
        var self = this;

        var parts = coordinates.split(",");
        var latitude = self.toDMS(parts[0]);
        var latitudeCardinal = Math.sign(parts[0]) >= 0 ? "N" : "S";

        var longitude = self.toDMS(parts[1]);
        var longitudeCardinal = Math.sign(parts[1]) >= 0 ? "E" : "W";

        return latitude + " " + latitudeCardinal + "," + longitude + " " + longitudeCardinal;
    };

    ConvertUtils.prototype.toLatLon = function (degrees, minutes, seconds, direction) {
        var self = this;

        var dd = degrees + minutes / 60 + seconds / (60 * 60);

        if (direction == "S" || direction == "W") {
            dd = dd * -1;
        }

        return dd;
    };

    ConvertUtils.prototype.dms2LatLon = function (coordinates) {
        var self = this;

        var parts = coordinates.split(/[^\d\w]+/);
        var lat = self.toLatLon(parts[0], parts[1], parts[2], parts[3]);
        var lng = self.toLatLon(parts[4], parts[5], parts[6], parts[7]);
    };

    return ConvertUtils;
});