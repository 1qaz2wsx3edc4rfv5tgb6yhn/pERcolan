// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in cordova-simulate or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.


// TODO --------- cap neighIncr to a reasonable number (of peers) in getOtherTeeth()
// NOTE ********* for dev I've relaxed the check for "+" in peer teeth!!


(function () {
    "use strict";
    var BASE_UUID = "00000000-0000-1000-8000-00805F9B34FB";
    var neighbors = []; // this is peers list
    var thisId = "0";
    var currMsg = thisId + "701Capitol";
    var beaconCount = 3;
    var addr;
    var otherTeethAcquired;
    var isBeacDone = false; // for setBeacon result
    var neighIncr = 0;

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
        //setBeacon();
        setTimeout(getOtherTeeth, 50);
        setTimeout(switchWithPeer, 10000); // 10 sec of getting teeth before switch        
        // --- moved make public b/c android gets the 1st detected peer name (eg before it's switched) 
        // --- and is unable to clear that cache while running (macrodroid does that for newer androids pre- app launch)
        //setTimeout(makeThisPublic, 12000);;        
    };
    function pickRandNeigh() {
        var selected = 0;
        selected = getRandomInt(0, neighbors.length);
        return selected;
    }
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function getOtherTeeth() {
        //var device_names = {};
        var updateDeviceName = function (device) {
            neighbors[neighIncr] = device.name; // fill neighbors list

            navigator.notification.alert('index: ' + neighIncr + ' ' + 'name for index: ' + neighbors[neighIncr]);
            //navigator.notification.alert(neighbors[neighIncr]); // prints hm1300 good!
            //navigator.notification.alert('neigh' + ' ' + neighbors);
            neighIncr++;
            //if (device.name == null) { }
            //else {
            //    //if (device.name.includes('+')) {
            //        //navigator.notification.alert(neighbors[neighIncr]);
            //    //}
            //}
        };

        // Add listener to receive newly found devices
        networking.bluetooth.onDeviceAdded.addListener(updateDeviceName);

        // With the listener in place, get the list of known devices
        networking.bluetooth.getDevices(function (devices) {
            for (var i = 0; i < devices.length; i++) {
                updateDeviceName(devices[i],i);
                neighbors[i] = devices[i];
                //navigator.notification.alert(neighbors[i].name);
            }
            //otherTeethAcquired = true;
        });

        // Now begin the discovery process.
        networking.bluetooth.startDiscovery(function () {
            // Stop discovery after 5 seconds.
            setTimeout(function () {
                networking.bluetooth.stopDiscovery();
            }, 10000);
        });
    }
    function switchWithPeer() {
        navigator.notification.alert('switching...');
        var picked = pickRandNeigh();
        //neighbors[picked] = '+703Cap';
        //var ri = getRandomInt(0, 10000);
        navigator.notification.alert(neighbor[picked]); // null
        bluetoothSerial.setName(neighbors[picked]);
        //bluetoothSerial.setName(results.input1);
        //navigator.notification.alert(toString.neighbors[picked]); // outputs null
    }
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
    function setBeacon() {
        function onPrompt(results) {
            //resetBlu(); // done by macrodroid exported file
            turnBluOn();
            addr = results.input1;
            //var ri = getRandomInt(0, 10000);
            bluetoothSerial.setName(addr);
            
        }

        navigator.notification.prompt(
            'beacon:',  // message
            onPrompt,                  // callback to invoke
            'enter pERc msg',            // title
            ['Ok'],             // buttonLabels
            getRandomInt(1,999999999)                // defaultText
        );
    }
    function turnBluOn() {
        networking.bluetooth.getAdapterState(function (adapterInfo) {
            // The adapterInfo object has the following properties:
            // address: String --> The address of the adapter, in the format 'XX:XX:XX:XX:XX:XX'.
            // name: String --> The human-readable name of the adapter.
            // enabled: Boolean --> Indicates whether or not the adapter is enabled.
            // discovering: Boolean --> Indicates whether or not the adapter is currently discovering.
            // discoverable: Boolean --> Indicates whether or not the adapter is currently discoverable.
            //adapterInfo.name = "adaptor name set - permissions granted"; // careful with local cache of names, could get stale
            //navigator.notification.alert('Adapter ' + adapterInfo.address + ': ' + adapterInfo.name);
        }, function (errorMessage) {
            navigator.notification.alert(errorMessage);
        });

        var enabled = false;
        networking.bluetooth.getAdapterState(function (adapterInfo) {
            enabled = adapterInfo.enabled;
            //navigator.notification.alert('this tooth is enabled');

            //adapterInfo.name = "name";
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
            //SSIDs = result;
            //navigator.notification.alert(result);
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
    function sendMsg() {
        networking.bluetooth.getAdapterState(function (adapterInfo) {
            // The adapterInfo object has the following properties:
            // address: String --> The address of the adapter, in the format 'XX:XX:XX:XX:XX:XX'.
            // name: String --> The human-readable name of the adapter.
            // enabled: Boolean --> Indicates whether or not the adapter is enabled.
            // discovering: Boolean --> Indicates whether or not the adapter is currently discovering.
            // discoverable: Boolean --> Indicates whether or not the adapter is currently discoverable.
            //adapterInfo.name = currMsg; // careful with local cache of names, could get stale
            navigator.notification.alert('Adapter ' + adapterInfo.address + ': ' + adapterInfo.name);
        }, function (errorMessage) {
            navigator.notification.alert(errorMessage);
        });

        var enabled = false;
        networking.bluetooth.getAdapterState(function (adapterInfo) {
            enabled = adapterInfo.enabled;
            navigator.notification.alert('this tooth is enabled');
        });
        //});
    }
    function recvMsgSetup() {
        networking.bluetooth.onReceive.addListener(function (receiveInfo) {
            if (receiveInfo.socketId !== socketId) {
                return;
            }

            // receiveInfo.data is an ArrayBuffer.
        });
    }    
    function receiveInfo() {
        // 1) check for recv.groupId header
        // 2) if no header assign this.header if (this.groupId.count < grpLimit)
        // 3) add to grpList based upon 2)
        // 4) if recv.groupId different ignore
        // 5) if in group already, make currMsg = incoming.Msg
    }
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
} )();