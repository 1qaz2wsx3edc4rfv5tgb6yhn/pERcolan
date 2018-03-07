GPSDetector
===========

Features
--------

- PhoneGap plugin used to detect if the GPS if enabled or disabled on the device, and able to open Location Settings and activate them manually
- Compatible with Cordova 2.2.0 to 3.1.0 (older and newer versions not tested)
- Tested (and working) on Android 4.4 KitKat (Nexus 5)


Installation
-----

This requires cordova 5.0+

    cordova plugin add cordova-plugin-android-gpsdetect

Usage
-----

Use the plugin like so:

    // <script type="text/javascript" charset="utf-8" src="./js/gpsDetectionPlugin.js"></script> : plugin will install this
    <script type="text/javascript">
		document.addEventListener("deviceready", onDeviceReady, false);
		
		function onDeviceReady() {
		
			// gpsDetect = cordova.require('cordova/plugin/gpsDetectionPlugin');
		
			var checkButton = document.getElementById("check");
			
			checkButton.onclick = function() {
				gpsDetect.checkGPS(onGPSSuccess, onGPSError);
			} 
			
			function onGPSSuccess(on) {
				if (on) alert("GPS is enabled");
				else alert("GPS is disabled");
			}
			
			function onGPSError(e) {
				alert("Error : "+e);
			}
			
			var openSettingsButton = document.getElementById("openSettings");

			openSettingsButton.onclick = function() {
				gpsDetect.switchToLocationSettings(onSwitchToLocationSettingsSuccess, onSwitchToLocationSettingsError);
			}

			function onSwitchToLocationSettingsSuccess() {

			}

			function onSwitchToLocationSettingsError(e) {
				alert("Error : "+e);
			}
		}
	</script>
