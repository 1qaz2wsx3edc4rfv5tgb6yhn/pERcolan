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
// this app requires MacroDroid (free) + imported actions file:
// reason PERC cannot programmatically perform bluetooth share service cache clearance (root required) ,
// but Macrodroid action recorder for android handles that with this importable action file:
//  https://drive.google.com/open?id=0B9G6-6K0q4geTDdsd3ZzM296cHM
//  ...that stops/restarts bluetooth share service where bluetooth names are cached (and seem to get stale consistently hence this workaround)


//  4 * 0.1 items todo: 
//  1) read file based default emergency beacon message from device and set that = this.name
//  2) impose any needed de-spamm filter to prevent peer saturation and deadlock/instability
//  3) add sensor data that may be relevant, including auto-load when vibration/Delta(spatial)/etc => earthquake, severe collision, and...?
//  5) switch only with beacons carrying the 'perc token' = "+" 


(function () {
    "use strict";
    var device_names = [""];
    var broadCastHist = [""]; 
    var isResponder = 0;
    var thisAddr = '';

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    function setupTasks() {
        //window.addEventListener('filePluginIsReady', function () { window.addEventListener('filePluginIsReady', function () { console.log('File plugin is ready'); }, false); ('File plugin is ready'); }, false);

        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);
        respondees.addEventListener('click', function () { navigator.notification.alert('respondee messages: ' + broadCastHist); }, false);


        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.
        var parentElement = document.getElementById('deviceready');
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');
        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        var permissions = cordova.plugins.permissions;
        // perms req android 6
        var list = [
            permissions.CAMERA,
            permissions.GET_ACCOUNTS,
            permissions.BLUETOOTH,
            permissions.BLUETOOTH_ADMIN,
            permissions.ACCESS_COARSE_LOCATION,
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
            permissions.READ_SYNC_STATS
            //permissions.LOCATION_HARDWARE, /* unused */
            //permissions.VIBRATE
        ];

        permissions.hasPermission(list, null, null); // deprecated, but it takes a list...does updated API take list obj?

        function error() {
            console.warn('error');
        }
        function success(status) {
            if (!status.hasPermission) {

                permissions.requestPermissions(
                    list,
                    function (status) {
                        if (!status.hasPermission) error();
                    },
                    error);
            }
        }

        

    }
    function buildResponder(isResponder) {
        navigator.notification.prompt(
            'Are you a First Responder? (if Yes, you will collect unique emergency requests on your device)',  // message
            onPrompt,                  // callback to invoke
            'For First Responders',    // title
            ['Yes', 'No']              // buttonLabels
        );
        function onPrompt(results) {
            if (results.buttonIndex == 1) {
                var storage = window.localStorage;
                storage.setItem("isResponder", "1");
            }
            else {
                var storage = window.localStorage;
                storage.setItem("isResponder", "0");
            }
        }

    }
    function onDeviceReady() {
        setupTasks();
        buildResponder();
        //setupTasks();        
        /*   
           * flow control map
           turnBluOn();
           setBeacon(); 
           makeThisPublic();
           "loop"
             getOtherTeeth();
             switchWithPeer();
           "end loop"
        */
        turnBluOn(setBeacon(makeThisPublic(getOtherTeeth())));
		(function () {
            setInterval(switchWithPeer, 12000);
        })();
    };
    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };
    function connectSocket() {
        networking.bluetooth.connect(device.address, BASE_UUID, function (socketId) {
            // Profile implementation here.
        }, function (errorMessage) {
            navigator.notification.alert('Connection failed: ' + errorMessage);
        });
    }
    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };


    function pickRandNeigh(numNeighs) {
        var selected = 0;
        selected = getRandomInt(0, numNeighs);
        return selected;
    }
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }    
    function getOtherTeeth() {
        
        var updateDeviceName = function (device) {
            device_names.push(device.name);
        };
        
        // Add listener to receive newly found devices
        networking.bluetooth.onDeviceAdded.addListener(updateDeviceName);

        // With the listener in place, get the list of known devices
        networking.bluetooth.getDevices(function (devices) {
            for (var i = 0; i < devices.length; i++) {
                updateDeviceName(devices[i]);
            }
        });
        //
        // Now begin the discovery process.
        networking.bluetooth.startDiscovery(function () {
            // Stop discovery after 5 seconds.
            setTimeout(function () {
                networking.bluetooth.stopDiscovery();
            }, 6000);
        });
    }
    
    function switchWithPeer() {       
        var storage = window.localStorage;  
        var isResp = storage.getItem("isResponder");
        if (isResp == "1") {
            // get unique emergency requests into a list for display 
            broadCastHist.push(device_names[0]);
            storage.setItem("devices", broadCastHist); // Pass a key name and its value to add or update that key.
            var value = storage.getItem("devices"); // Pass a key name to get its value.
            //navigator.notification.alert('collected requests: ' + value);
            //storage.removeItem(key) // Pass a key name to remove that key from storage.
        }
        else {
            var chosen = '';
            var picked = pickRandNeigh(device_names.length);
            broadCastHist.push(broadCastHist[picked]);
            navigator.notification.alert('chosen ' + broadCastHist[picked]);
            bluetoothSerial.setName(broadCastHist[picked]);
        }
    }
    // needs f***in root
    //function resetBlu(adaptorInfo) {
    //    navigator.startApp.check("com.android.bluetooth", function (message) { /* success */
    //        navigator.notification.alert(message); // => OK
    //    },
    //    function (error) { /* error */
    //        navigator.notification.alert(error);
    //    });
    //    //Start application without parameters
    //    networking.bluetooth.requestDisable(function () {
    //        // The adapter is now enabled 
    //    }, function () {
    //        // The user has cancelled the operation 
    //    });
    //    navigator.startApp.start("com.android.bluetooth", function (message) {  /* success */
    //        navigator.notification.alert(message); // => OK
    //    },
    //    function (error) { /* error */
    //        navigator.notification.alert(error);
    //    });
    //}
    
    function setBeacon() {
        function onPrompt(results) {
            //resetBlu(); // done by macrodroid exported file
            //turnBluOn();
            thisAddr = results.input1;
            //var ri = getRandomInt(0, 10000);
            bluetoothSerial.setName(thisAddr);
            
        }

        navigator.notification.prompt(
            'beacon:',  // message
            onPrompt,                  // callback to invoke
            'enter pERc msg',            // title
            ['Ok'],             // buttonLabels
            getRandomInt(1,999999999)                // defaultText
        );
    }
    function turnBluOn(obj1) {
        networking.bluetooth.getAdapterState(function (adapterInfo) {
            // The adapterInfo object has the following properties:
            // address: String --> The address of the adapter, in the format 'XX:XX:XX:XX:XX:XX'.
            // name: String --> The human-readable name of the adapter.
            // enabled: Boolean --> Indicates whether or not the adapter is enabled.
            // discovering: Boolean --> Indicates whether or not the adapter is currently discovering.
            // discoverable: Boolean --> Indicates whether or not the adapter is currently discoverable.
            // adapterInfo.name = "adaptor name set - permissions granted"; // careful with local cache of names, could get stale
        }, function (errorMessage) {
            navigator.notification.alert(errorMessage);
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
                navigator.notification.alert(devices[i].address + "|" + devices[i].name);
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

// need f***** root 
// Macrodroid action recorder for android handles that with this importable action file:
//  https://drive.google.com/open?id=0B9G6-6K0q4geTDdsd3ZzM296cHM
//function resetBlu(adaptorInfo) {
    //    //navigator.startApp.check("com.android.bluetooth", function (message) { /* success */
    //    //    navigator.notification.alert(message); // => OK
    //    //},
    //    //function (error) { /* error */
    //    //    navigator.notification.alert(error);
    //    //});
    //    //Start application without parameters
    //    //networking.bluetooth.requestDisable(function () {
    //    //    // The adapter is now enabled 
    //    //}, function () {
    //    //    // The user has cancelled the operation 
    //    //});
    //    //navigator.startApp.start("com.android.bluetooth", function (message) {  /* success */
    //    //    navigator.notification.alert(message); // => OK
    //    //},
    //    //function (error) { /* error */
    //    //    navigator.notification.alert(error);
    //    //});

//}
