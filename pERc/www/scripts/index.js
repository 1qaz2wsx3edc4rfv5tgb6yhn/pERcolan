// 
// Lawrence Sweet
// Peer EmeRgency Communications Outside of Linked Area Networks - PEERCOLAN - "Bluetooth Help beacons (in urban environments), with address and/or other locating information, when Cellular/Internet are down after a natural disaster" 
// PERC beta v0.5 idea copyright 2016 - 2017
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


//  5 * 0.1 items todo: 
//  1) read file based default emergency beacon message from device and set that = this.name
//  2) impose any needed de-spamm filter to prevent peer saturation and deadlock/instability
//  3) add sensor data that may be relevant, including auto-load when vibration/Delta(spatial)/etc => earthquake, severe collision, and...?
//  4) refactor while loop/etc into synchronous calls of async 'tooth functions
//  5) switch only with beacons carrying the 'perc token' = "+" 


(function () {
    "use strict";
    var device_names = '';
    var broadCastHist = [""]; 
    // try, not, to, look,
    var step0 = 0;
    var step1 = 0;
    var step2 = 0;
    var step3 = 0;
    var step4 = 0;
    var step5 = 0;

    var thisAddr = '';

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    function onDeviceReady() {
        //window.addEventListener('filePluginIsReady', function () { window.addEventListener('filePluginIsReady', function () { console.log('File plugin is ready'); }, false); ('File plugin is ready'); }, false);

        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);

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
        // horrible flow control looping, callbacks difficult to debug will refactor later
        //step0 = 1;
        //while (step5 == 0) {
        //    if (step0) {
        //        turnBluOn();
        //        step1 = 1;
        //    }
        //    if (step1) { setBeacon(); }
        //    if (step2) { makeThisPublic(); }
        //    if (step3) {
        //        getOtherTeeth();
        //        step4 = 1;
        //    }
        //    if (step4) { step5 = 1; }
        //}
        //(function () {
        //    setInterval(switchWithPeer, 12000);
        //})(); //
        //
        turnBluOn(setBeacon(makeThisPublic(getOtherTeeth(stop))));
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


	function test1(){
		navigator.notification.alert('1');	
	}
	function test2(){
		navigator.notification.alert('2');
	}
	function test3(){
		navigator.notification.alert('3');
    }
    var stop = function () { };
    function pickRandNeigh() {
        var selected = 0;
        selected = getRandomInt(0, neighbors.length);
        return selected;
    }
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }    
    function getOtherTeeth() {
        
        var updateDeviceName = function (device) {
            device_names += device.name + ',';
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
            // Stop discovery after 5 seconds.
            setTimeout(function () {
                networking.bluetooth.stopDiscovery();
                step4 = 1;
            }, 6000);
        });
    }
    
    function switchWithPeer() {
        var chosen = '';
        for (var i = 0; i < device_names.length; i++) {
            //navigator.notification.alert('i ' + i);
             
            //var _index = 0; //device_names.indexOf('P', 0);  // 0 means start at pos 0
            ////navigator.notification.alert('_index ' + _index);
            //if (_index > -1) { // eg found a '+'
            //    //navigator.notification.alert('found the n char');
            //    for (var j = _index; j < device_names.length; j++) {
            //        if (device_names[j] != ',') {
            //            chosen = device_names[j];   // so we get first discovered peer!
            //        }
            //        else {
            //            j = device_names.length; // break out
            //        }
            //    }
            //} 
            ////navigator.notification.alert('chosen' + chosen);
            
            ////var dupBcast = 0;
            broadCastHist.push(device_names[0]);            
            //for (var i = 0; i < broadCastHist.length; i++) {
            //    dupBcast += occurrences(broadCastHist[i], chosen);
            //    if (dupBcast > 4) {
            //        chosen = thisAddr;
            //        navigator.notification.alert('4 repeat found ' + chosen);
            //        broadCastHist[i] = chosen;
            //    }
            //}
        }
        //chosen = chosen.substring(0, _index);
        navigator.notification.alert('chosen' + device_names[0]);
        //navigator.notification.alert('hist' + broadCastHist);
        bluetoothSerial.setName(device_names[0]); 
        
    }
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
    function addrRead() {
        readFromFile(cordova.file.dataDirectory + 'addr', function (data) {
            fileData = data;
            navigator.notification.alert('data: ' + toString.fileData);
        });
    }
    function firstRunAddressStore(callBack) {
        //writeToFile('addr', { addr: '701cap' });
        //callback(function () { navigator.notification.alert('file data: ' + fileData); });
        //navigator.notification.alert('data dir path: ' + cordova.file.dataDirectory);
        callBack();
    }
    function readFromFile(fileName, cb) {
        var pathToFile = fileName;
        window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
            fileEntry.file(function (file) {
                navigator.notification.alert('in reader file= ' + toString.file);
                var reader = new FileReader();

                reader.onloadend = function (e) {
                    cb(JSON.parse(this.result));
                };

                reader.readAsText(file);
            }, errorHandler.bind(null, fileName));
        }, errorHandler.bind(null, fileName));
    }
    function writeToFile(fileName, data) {
        data = JSON.stringify(data, null, '\t');
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (directoryEntry) {
            directoryEntry.getFile(fileName, { create: true }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function (e) {
                        // for real-world usage, you might consider passing a success callback
                        //navigator.notification.alert('Write of file "' + fileName + '"" completed.');
                    };

                    fileWriter.onerror = function (e) {
                        // you could hook this up with our global error handler, or pass in an error callback
                        navigator.notification.alert('Write failed: ' + e.toString());
                    };

                    var blob = new Blob([data], { type: 'text/plain' });
                    fileWriter.write(blob);
                }, errorHandler.bind(null, fileName));
            }, errorHandler.bind(null, fileName));
        }, errorHandler.bind(null, fileName));
    }
    var errorHandler = function (fileName, e) {
        var msg = '';

        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'Storage quota exceeded';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'File not found';
                break;
            case FileError.SECURITY_ERR:
                msg = 'Security error';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'Invalid modification';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'Invalid state';
                break;
            default:
                msg = 'Unknown error';
                break;
        };

        navigator.notification.alert('Error (' + fileName + '): ' + msg);
    }   
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
        step2 = 1;
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
        step0 = 0;
    }
    //function turnBluOff() {
    //    networking.bluetooth.getAdapterState(function (adapterInfo) {
    //        // The adapterInfo object has the following properties:
    //        // address: String --> The address of the adapter, in the format 'XX:XX:XX:XX:XX:XX'.
    //        // name: String --> The human-readable name of the adapter.
    //        // enabled: Boolean --> Indicates whether or not the adapter is enabled.
    //        // discovering: Boolean --> Indicates whether or not the adapter is currently discovering.
    //        // discoverable: Boolean --> Indicates whether or not the adapter is currently discoverable.
    //        // adapterInfo.name = "adaptor name set - permissions granted"; // careful with local cache of names, could get stale
    //    }, function (errorMessage) {
    //        navigator.notification.alert(errorMessage);
    //    });
        
    //    var enabled = false;
    //    networking.bluetooth.getAdapterState(function (adapterInfo) {
    //        enabled = adapterInfo.disabled;
    //    });
        

    //    var onSuccess = function (result) {
    //        //SSIDs = result;
    //        //navigator.notification.alert(result);
    //    };
    //    var onError = function (result) {
    //        navigator.notification.alert(result);
    //    };
    //    networking.bluetooth.
    //}
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
        step3 = 1;
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

// does not perform bluetooth share service cache clearnce as intended in this form, ... 
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