var exec = require('cordova/exec');

function gpsDetect() { };

gpsDetect.prototype.checkGPS = function (successCallback, failureCallback) {
    exec(successCallback, failureCallback, 'GpsDetectionPlugin', 'gpsDetection', []);
};

gpsDetect.prototype.switchToLocationSettings = function (successCallback, failureCallback) {
    exec(successCallback, failureCallback, 'GpsDetectionPlugin', 'gpsActivation', []);
};

module.exports = new gpsDetect();