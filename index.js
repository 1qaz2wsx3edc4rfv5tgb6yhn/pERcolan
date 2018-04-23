// 
// Lawrence Sweet
// Peer EmeRgency Communications Outside of Linked Area Networks - PEERCOLAN - "Bluetooth Help beacons (in urban environments), with address and/or other locating information, when Cellular/Internet are down after a natural disaster" 
// PERC beta v0.6 idea copyright 2016 - 2017
//
// usage: uses a bluetooth name as an emergency beacon, after a (natural) disaster, to other bluetooth devices with your address and other data relevant to your rescue.
//        if bluetooth peers in range also have the PERC client, you will be (randomly) "paired" (not in bluetooth sense) to a PERC peer at which point:
//        You and your peer will set each others bluetooth name as your own, and, at setintervals, this will continue until your rescue beacon 
//        has permeated 100m-contiguous PERC clients which may or may not be able to assist (upon receiving your address/txtmsg) or may be a fire, police, etc
//        associated PERC installed cell/bluetooth (android) device.
//

// *** shake detect is ios ready *** //

(function () {
    "use strict";
    var device_names = {}; // key value pair
    var devices = [""];
    var broadCastHist = {}; 
    var isResponder = 0;
    var thisAddr = '+';
    var firstRun = 1;
    var switchToAddr = '';
    var gpsCord = ''; // eg 40.446° N 79.982° W

    //var exit = document.getElementById("exit");
    //exit.addEventListener('click', function () { exit(); }, false);

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    //document.addEventListener('pause', onPause.bind(this), false);
    //document.addEventListener('resume', onResume.bind(this), false);
    // didnt fly: document.addEventListener("touchstart", function () { touchStart; }, false);

    //function touchStart() {
    //    navigator.notification.alert("touched");
    //}
    function setupTasks() {
        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.
        var parentElement = document.getElementById('deviceready');
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');
        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
        //navigator.notification.alert("before perms cordova.plugins.permissions");
        var permissions = cordova.plugins.permissions;
        // perms req android 6
        var list = [
            permissions.CAMERA,
            permissions.GET_ACCOUNTS,
            permissions.BLUETOOTH,
            permissions.BLUETOOTH_ADMIN,
            permissions.ACCESS_COARSE_LOCATION,
            permissions.ACCESS_FINE_LOCATION,
            permissions.INTERNET,
            permissions.ACCESS_LOCATION_EXTRA_COMMANDS,
            permissions.ACCESS_NETWORK_STATE,
            permissions.ACCESS_NOTIFICATION_POLICY,
            permissions.ACCESS_WIFI_STATE,
            permissions.BROADCAST_STICKY,
            permissions.CHANGE_NETWORK_STATE,
            permissions.CHANGE_WIFI_MULTICAST_STATE,
            permissions.CHANGE_WIFI_STATE,
            permissions.KILL_BACKGROUND_PROCESSES,
            permissions.NFC,
            permissions.READ_SYNC_SETTINGS,
            permissions.READ_SYNC_STAT
        ];
        //permissions.requestPermission(list, success, error);
        permissions.hasPermission(list, null, null); // deprecated, but it takes a list...does updated API take list obj?

        //function error() {
        //    console.warn('permission error bitches');
        //}

        //function success(status) {
        //    if (!status.hasPermission) {

        //        permissions.requestPermissions(
        //            list,
        //            function (status) {
        //                if (!status.hasPermission) error();
        //            },
        //            error);
        //    }
        //}
    }
    function localPhysicalAddr() {
        navigator.notification.prompt(
            'Enter your address into the window. Also, Are you a First Responder? (if Yes, you will collect unique emergency requests on your device)',  // message
            onPrompt,                  // callback to invoke
            'For First Responders',    // title
            ['Yes', 'No']              // buttonLabels
        );
        function onPrompt(results) { // when not firstreposnderr addr is blank on refresh
            if (results.buttonIndex == 1) {
                var storage = window.localStorage;
                var storage2 = window.localStorage;
                storage.setItem("isResponder", "1");
                storage2.setItem("addr", thisAddr + results.input1);
            }
            else {
                var storage = window.localStorage;
                var storage2 = window.localStorage;
                storage.setItem("isResponder", "0");
                storage2.setItem("addr", thisAddr + results.input1);
            }
        }
    } 
    function addrResponderMenu() {
        var storage = window.localStorage;
        var storage2 = window.localStorage;
        var _thisAddr = storage.getItem("addr");
        var _isResponder = storage2.getItem("isResponder");
        //navigator.notification.alert("addr: " + thisAddr + "    " + "isResponder? " + isResponder);
    }
    function shakeDetectThread() {
        
            //navigator.notification.alert('started shake watch');
        //var launchPerc = 1;
        //turnBluOn();
        //setThisBeaconMsg(makeThisPublic(getOtherTeeth()));
        //(function () {
        //    setInterval(switchWithPeer, 12000);
        //})();
            var onShake = function () {
                navigator.notification.alert('shake detected');
                turnBluOn(setThisBeaconMsg(makeThisPublic(getOtherTeeth())));
                (function () {
                    setInterval(switchWithPeer, 1000);
                    launchPerc = 0;
                })();
                /* will never get here! */
                navigator.notification.alert('after interval loop code');

                // Fired after a shake is detected and blutooth event loop has launched abpve
                if (launchPerc == 0) {
                    // read address, set beacon
                    //shake.stopWatch();
                    var storage = window.localStorage;
                    thisAddr = storage.getItem("addr");
                    //navigator.notification.alert(thisAddr + ' is broadcasting');
                }
            };

            var onError = function () {
                navigator.notification.alert("accelerometer err");
            };

             //Start watching for shake gestures and call "onShake"
             //with a shake sensitivity of 40 (optional, default 30)
            shake.startWatch(onShake, 10, onError);
       

        
    }
    //function exit() {
    //    var exit = document.getElementById("exit");
    //    exit.innerHTML = "Background run mode is OFF";
    //    exit.style.color = "green";
    //    var wrapper = document.getElementById("deviceready");
    //    wrapper.appendChild(exit);
    //    cordova.plugins.backgroundMode.disable();
    //}
    function showAllSessionVars() {
        var storage = window.localStorage;
        var storage2 = window.localStorage;
        var storage3 = window.localStorage;
        var _thisAddr = storage.getItem("addr");
        var _isResponder = storage2.getItem("isResponder");
        var _gps = storage3.getItem("gps");

        //navigator.notification.alert("addr: " + _thisAddr + " isResponder: " + _isResponder + " gps: " + _gps);
    }
    function onDeviceReady() {
        // need an initial random address before user to ui input so that network peers are not seen as the same
        var selected = 0;
        selected = getRandomInt(0, 1024);
        thisAddr += selected;

        //showAllSessionVars();

        setupTasks();

        // turn on and session store local gps coords
        GPSinit();

        // now get beacon msg from user and 1st responder status
        localPhysicalAddr();

        // take commented out code put in "onExit()" type event --->
        // ---> try {
        //    // enable run in background mode
        //    cordova.plugins.backgroundMode.enable();
        //    // prevent exit
        //    cordova.plugins.backgroundMode.overrideBackButton();
        //    // remove from tasks list
        //    cordova.plugins.backgroundMode.excludeFromTaskList();
        //}
        //catch (error) { navigator.notification.alert('background run function(s) error: ' + error); }

        
        //navigator.notification.alert('right before shake detect call');
        shakeDetectThread(); // main event loop
        

        
        


  //      turnBluOn(setBeacon(makeThisPublic(getOtherTeeth())));
		//(function () {
  //          setInterval(switchWithPeer, 1000);
  //      })();

        //switchWithPeer();

    };
    function GPSinit() {        
        gpsDetect.checkGPS(onGPSSuccess, onGPSError);        
        function onGPSSuccess(on) {
            if (on)
            {
                //alert("GPS is enabled");
            }
            else alert("GPS is disabled");
        }
        function onGPSError(e) {
            //alert("Error : " + e);
        }        
        gpsDetect.switchToLocationSettings(onSwitchToLocationSettingsSuccess, onSwitchToLocationSettingsError);  
        function onSwitchToLocationSettingsSuccess() {
        }
        function onSwitchToLocationSettingsError(e) {
            alert("Error : " + e);
        }
         //now record coordinates
         //onSuccess Callback
         //This method accepts a Position object, which contains the
         //current GPS coordinates        
        var onSuccess = function (position) {
            /*navigator.notification.alert('Latitude: ' + position.coords.latitude + '\n' +
                'Longitude: ' + position.coords.longitude + '\n' +
                'Altitude: ' + position.coords.altitude + '\n' +
                'Accuracy: ' + position.coords.accuracy + '\n' +
                'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
                'Heading: ' + position.coords.heading + '\n' +
                'Speed: ' + position.coords.speed + '\n' +
                'Timestamp: ' + position.timestamp + '\n');*/
            thisAddr += "{ lat: " + position.coords.latitude + " long: " + position.coords.longitude + " alt: " + position.coords.altitude + " time: " + position.timestamp + " }";

            var storage = window.localStorage;
            storage.setItem("addr", thisAddr);
            bluetoothSerial.setName(thisAddr);      
        };
        // onError Callback receives a PositionError object
        //
        function onError(error) {
            navigator.notification.alert('code: ' + error.code + '\n' +
                'message: ' + error.message + '\n');
        }
        navigator.geolocation.getCurrentPosition(onSuccess, onError);

    }
    //function onPause() {
    //    // TODO: This application has been suspended. Save application state here.
    //};
    function connectSocket() {
        networking.bluetooth.connect(device.address, BASE_UUID, function (socketId) {
            // Profile implementation here.
        }, function (errorMessage) {
            navigator.notification.alert('Connection failed: ' + errorMessage);
        });
    }
    //function onResume() {
    //    // TODO: This application has been reactivated. Restore application state here.
    //};
    function decideBeacon(numNeighs) { // eg set this blutooth name based upon pnp/neighbor router
        // *** commented out random selection ***
        var selected = 0;
        selected = getRandomInt(0, numNeighs);
        return selected;
        // *** end random selection

    }
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }    
    function getOtherTeeth() {
        // *** device_names[device.address] == 'undefined' when slot is empty
        var updateDeviceName = function (device) {
            //if (device.name.includes("+")) {
            //var storage = window.localStorage;
            //broadCastHist[device.name] += device.name; 
            device_names[device.address] = device.name;
                //switchToAddr = device.address;
            //}
            //navigator.notification.alert('msg: ' + device_names[device.address]);

        };

        // Add listener to receive newly found devices 
        networking.bluetooth.onDeviceAdded.addListener(updateDeviceName);

        // With the listener in place, get the list of known devices 
        networking.bluetooth.getDevices(function (devices) {
            for (var i = 0; i < devices.length; i++) {
                updateDeviceName(devices[i]);
            }
        });

        // Now begin the discovery process. 
        networking.bluetooth.startDiscovery(function () {
            // Stop discovery after 30 seconds. 
            setTimeout(function () {
                networking.bluetooth.stopDiscovery();
            }, 300000);
        });
        
    }
    function countProperties(obj) {
        var count = 0;

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                ++count;
        }

        return count;
    }
    function switchWithPeer() {
        // Stop watching for shake gestures
        //shake.stopWatch();

        getOtherTeeth();
        var storage = window.localStorage;  
        var isResp = storage.getItem("isResponder");
        if (isResp == "1") {
            // get unique emergency requests into a list for display 
            //broadCastHist.push(device_names[0]);
            //storage.setItem("devices", broadCastHist); // Pass a key name and its value to add or update that key.
            //var value = storage.getItem("devices"); // Pass a key name to get its value.
            //navigator.notification.alert('collected requests: ' + value);
            //storage.removeItem(key) // Pass a key name to remove that key from storage.
        }
        else {
            var chosen = 0;
            while (chosen != 1) {
                var picked = decideBeacon(countProperties(device_names)); // replace with neigh routing function
                var cnt = 0;
                for (var key in device_names) { // key is mac aa::bb::cc:: etc and val = blue name
                    if (device_names.hasOwnProperty(key)) {                        
                            if (picked == cnt) {
                                //navigator.notification.alert(device_names[key]);
                                bluetoothSerial.setName(device_names[key]);                                
                                chosen = 1;
                                broadCastHist[key] += device_names[key];
                                document.getElementById("deviceProperties").innerHTML = "{" + broadCastHist[key] + "}"; 
                               
                                var str = document.getElementById("history").innerHTML;

                                // octet literal error in strict mode:
                                //document.getElementById("history").innerHTML += "{" + device_names[key] + "}";
                                //var re = new RegExp('\b(\w+)(?:\s+\1\b)+');
                                //var rslt = re.exec(document.getElementById("history").innerHTML);
                                //document.getElementById("history").innerHTML += rslt;
                            }
                            //navigator.notification.alert(key + " -> " + device_names[key]);
                            cnt++;
                    }
                }
            }
        }
        // works!! navigator.notification.alert(broadCastHist)
        var storage2 = window.localStorage;
        storage2.setItem("history", broadCastHist);
        //navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }    
    function setThisBeaconMsg() {
        var storage = window.localStorage;
        var thisGPS = storage.getItem("gps");
        networking.bluetooth.getAdapterState(function (adapterInfo) {
            bluetoothSerial.setName(thisAddr + " gps: " + thisGPS);
        }, function (errorMessage) {
            //navigator.notification.alert(errorMessage);
        });
    }
    function turnBluOn() {
        networking.bluetooth.getAdapterState(function (adapterInfo) {
            // The adapterInfo object has the following properties:
            // address: String --> The address of the adapter, in the format 'XX:XX:XX:XX:XX:XX'.
            // name: String --> The human-readable name of the adapter.
            // enabled: Boolean --> Indicates whether or not the adapter is enabled.
            // discovering: Boolean --> Indicates whether or not the adapter is currently discovering.
            // discoverable: Boolean --> Indicates whether or not the adapter is currently discoverable.
            // adapterInfo.name = "adaptor name set - permissions granted"; // careful with local cache of names, could get stale
        }, function (errorMessage) {
            //navigator.notification.alert(errorMessage);
        });

        var enabled = false;
        networking.bluetooth.getAdapterState(function (adapterInfo) {
            enabled = adapterInfo.enabled;
        });

        networking.bluetooth.onAdapterStateChanged.addListener(function (adapterInfo) {
            // The adapterInfo object has the same properties as getAdapterState
            if (adapterInfo.enabled !== enabled) {
                enabled = adapterInfo.enabled;
                if (enabled) {
                    //navigator.notification.alert('this tooth listener has been added');
                } else {
                    navigator.notification.alert('this tooth listener failed bc enabled is false');
                }
            }
        });

        networking.bluetooth.requestEnable(function () {
            // The adapter is now enabled
          
            
        }, function () {
            // The user has cancelled the operation
        });

        var onSuccess = function (result) {
           
        };
        var onError = function (result) {
            navigator.notification.alert(result);
          
        };
    }    
    function getMyBluDevices() {
        networking.bluetooth.getDevices(function (devices) {
            for (var i = 0; i < devices.length; i++) {
                // The deviceInfo object has the following properties:
                // address: String --> The address of the device, in the format 'XX:XX:XX:XX:XX:XX'.
                // name: String --> The human-readable name of the device.
                // paired: Boolean --> Indicates whether or not the device is paired with the system.
                // uuids: Array of String --> UUIDs of protocols, profiles and services advertised by the device.
                if (j == i) {
                    //navigator.notification.alert(devices[i].address + "|" + devices[i].name);
                }
            }
        });
    }
    function makeThisPublic() { // eg discoverable blutooth on this device
        networking.bluetooth.requestDiscoverable(function () {
            // The device is now discoverable
        }, function () {
            // The user has cancelled the operation
            });
    }      
    function occurrences(string, subString, allowOverlapping) {

        string += "";
        subString += "";
        if (subString.length <= 0) return (string.length + 1);

        var n = 0,
            pos = 0,
            step = allowOverlapping ? 1 : subString.length;

        while (true) {
            pos = string.indexOf(subString, pos);
            if (pos >= 0) {
                ++n;
                pos += step;
            } else break;
        }
        return n;
    }
})();