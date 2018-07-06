// 
// Lawrence Sweet
// Peer EmeRgency Communications Outside of Linked Area Networks - PEERCOLAN - "Bluetooth Help beacons (in urban environments), with address and/or other locating information, when Cellular/Internet are down after a natural disaster" 
// PERC beta v0.6 idea copyright 2016 - 2017
//
// *** todo - first run code borked
// *** todo - background to foreground control





// usage: uses a bluetooth name as an emergency beacon, after a (natural) disaster, to other bluetooth devices with your address and other data relevant to your rescue.
//        if bluetooth peers in range also have the PERC client, you will be (randomly) "paired" (not in bluetooth sense) to a PERC peer at which point:
//        You and your peer will set each others bluetooth name as your own, and, at setintervals, this will continue until your rescue beacon 
//        has permeated 100m-contiguous PERC clients which may or may not be able to assist (upon receiving your address/txtmsg) or may be a fire, police, etc
//        associated PERC installed cell/bluetooth (android) device.
//
//
// list of automatically granted permissions android 6 sdk 23 2015+
/*

android.permission.ACCESS_LOCATION_EXTRA_COMMANDS
android.permission.ACCESS_NETWORK_STATE
android.permission.ACCESS_NOTIFICATION_POLICY
android.permission.ACCESS_WIFI_STATE
android.permission.ACCESS_WIMAX_STATE
android.permission.BLUETOOTH
android.permission.BLUETOOTH_ADMIN
android.permission.BROADCAST_STICKY
android.permission.CHANGE_NETWORK_STATE
android.permission.CHANGE_WIFI_MULTICAST_STATE
android.permission.CHANGE_WIFI_STATE
android.permission.CHANGE_WIMAX_STATE
android.permission.DISABLE_KEYGUARD
android.permission.EXPAND_STATUS_BAR
android.permission.FLASHLIGHT
android.permission.GET_ACCOUNTS
android.permission.GET_PACKAGE_SIZE
android.permission.INTERNET
android.permission.KILL_BACKGROUND_PROCESSES
android.permission.MODIFY_AUDIO_SETTINGS
android.permission.NFC
android.permission.READ_SYNC_SETTINGS
android.permission.READ_SYNC_STATS
android.permission.RECEIVE_BOOT_COMPLETED
android.permission.REORDER_TASKS
android.permission.REQUEST_INSTALL_PACKAGES
android.permission.SET_TIME_ZONE
android.permission.SET_WALLPAPER
android.permission.SET_WALLPAPER_HINTS
android.permission.SUBSCRIBED_FEEDS_READ
android.permission.TRANSMIT_IR
android.permission.USE_FINGERPRINT
android.permission.VIBRATE
android.permission.WAKE_LOCK
android.permission.WRITE_SYNC_SETTINGS
com.android.alarm.permission.SET_ALARM
com.android.launcher.permission.INSTALL_SHORTCUT
com.android.launcher.permission.UNINSTALL_SHORTCUT

*/


// *** shake detect is ios ready *** //

/* quake stats

Comparison of instrumental and felt intensity[edit]
Peak ground acceleration provides a measurement of instrumental intensity, that is, ground shaking recorded by seismic instruments. Other intensity scales measure felt intensity, based on eyewitness reports, felt shaking, and observed damage. There is correlation between these scales, but not always absolute agreement since experiences and damage can be affected by many other factors, including the quality of earthquake engineering.

Generally speaking,

0.001 g (0.01 m/s²) – perceptible by people
0.02  g (0.2  m/s²) – people lose their balance
0.50  g – very high; well-designed buildings can survive if the duration is short.[7]
Correlation with the Mercalli scale[edit]

The United States Geological Survey developed an Instrumental Intensity scale, which maps peak ground acceleration and peak ground velocity on an intensity scale similar to the felt Mercalli scale. These values are used to create shake maps by seismologists around the world.
Instrumental	Acceleration	Velocity	Perceived shaking	Potential damage
Intensity	(g)	(cm/s)
I	< 0.0017	< 0.1	Not felt	None
II–III	0.0017 – 0.014	0.1 – 1.1	Weak	None
IV	0.014 – 0.039	1.1 – 3.4	Light	None
V	0.039 – 0.092	3.4 – 8.1	Moderate	Very light
VI	[[[ vert accel *** 0.092 – 0.18 ]]]	8.1 – 16	Strong	Light
VII	[[[ vert acell *** 0.18 – 0.34 ]]]	16 – 31	Very strong	Moderate
VIII	0.34 – 0.65	31 – 60	Severe	Moderate to heavy
IX	0.65 – 1.24	60 – 116	Violent	Heavy
X+	> 1.24	> 116	Extreme	Very heavy

Other intensity scales


*/

   
       
(function () {
   
    // region vars
    // "use strict"; no, MyNetwork is shared globally
    var device_names = {}; // key value pair
    var devices = [""];
    var broadCastHist = {};
    var isResponder = 0;
    var thisAddr = '+';
    var firstRun = 0;
    var switchToAddr = '';
    var gpsCord = ''; // eg 40.446° N 79.982° W
    var hFreq = 0; //cycles/s
    var accelTrainingData = [];  // training data Array from sensors
    var accelRealData = [];  // starts filling up when any shaking above threshold=? is met - must be a quick load and NN prediction
    var testData = [11, 12, 14.5, 10.9];   // dev tests
    var isQuake = 0;
    var sampleNum = 0;
    var totalAccel = 0.0;
    var recursedAccelCount = 0;
    var stopTraining = 0;
    var timeZero = 0;
    var timeFinal = 0;
    var isTrained = 0;
    var prediction = 0.0 //0..1
    //var quakeCheckTriggered = function () {  }
    //var isQuake = function getShakePrediction() {
    //    if (prediction > 0.8) {
    //        return 1;
    //    }
    //    else { return 0; }
    //}
    var watchID = null;
    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    function processEvent(event) {
        // process the event object
        function onSuccess(acceleration) {
            alert('Acceleration X: ' + acceleration.x + '\n' +
                'Acceleration Y: ' + acceleration.y + '\n' +
                'Acceleration Z: ' + acceleration.z + '\n' +
                'Timestamp: ' + acceleration.timestamp + '\n');
            if (isTrained) {
                //shake.stopWatch();
                navigator.accelerometer.clearWatch(watchID);
                //navigator.notification.alert('shake watch off, getting real time accel data (implies training==done)');
                for (var i = 0; i < 1050; i++) {
                    totalAccel = Math.abs(acceleration.z);
                    dataClass.push(totalAccel);
                }
                guessQuake(accelRealData);
            }   // check prediction! then start bluchatting if yes. not training when used here => rename function
            else { // still training, 
                //shake.stopWatch();
                navigator.notification.alert('shake watch continues, implies training==not done)');
                //trainNNbp(accelTrainingData);
                //shake.startWatch();
            }
        }
        function onError() {
            alert('onError!');
        }
        var options = { frequency: 3000 };  // Update every 3 seconds
        watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);
    }
    
    //document.addEventListener("devicemotion", processEvent.bind(this), false);
    function onSuccess(acceleration) {
        //alert('Acceleration X: ' + acceleration.x + '\n' +
        //    'Acceleration Y: ' + acceleration.y + '\n' +
        //    'Acceleration Z: ' + acceleration.z + '\n' +
        //    'Timestamp: ' + acceleration.timestamp + '\n');
        totalAccel = Math.abs(acceleration.z);
        if (isTrained) {            
            accelRealData.push(totalAccel);
        }
        else {
            accelTrainingData.push(totalAccel); 
        }
    }

    // onError: Failed to get the acceleration
    //
    function onError() {
        alert('onError!');
    }

    function onDeviceReady() {      
        //navigator.accelerometer.getCurrentAcceleration(onSuccess, onError);
        if (!isTrained) {
            trainNNbp(accelTrainingData);
        }
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

        shakeDetectThread(); // main event loop
    }
    function shakeDetectThread() {
        
        if (isTrained) {
            for (var i = 0; i < 1050; i++) {
                navigator.accelerometer.getCurrentAcceleration(onSuccess, onError);

            }
            guessQuake(accelRealData);
        }   // check prediction! then start bluchatting if yes. not training when used here => rename function
        else {
            //noop
        }
        //
        // want to shove n units of accel. data into trained NN - can it increment and re-check as it grows?
        //
        //var onShake = function () {
            
        //    if (isTrained) {
        //        shake.stopWatch();
        //        //navigator.notification.alert('shake watch off, getting real time accel data (implies training==done)');
        //        for (var i = 0; i < 1050; i++) {
        //            totalAccel = Math.abs(acceleration.z);
        //            dataClass.push(totalAccel);
        //        }
        //        guessQuake(accelRealData);
        //    }   // check prediction! then start bluchatting if yes. not training when used here => rename function
        //    else { // still training, 
        //        //shake.stopWatch();
        //        navigator.notification.alert('shake watch continues, implies training==not done)');
        //        //trainNNbp(accelTrainingData);
        //        //shake.startWatch();
        //    }
        //    //shake.startWatch();
        //    //timeZero = 0;
        //    //if (timeZero == 0) {
        //    //    timeZero = new Date().getTime() / 1000;
        //    //    //navigator.notification.alert(timeZero); // delta from o to f ~150 for 1.5min 
        //    //    timeFinal = new Date().getTime() / 1000;
        //    //}
        //    //timeFinal = timeFinal + 1;
        //    //if (timeFinal - timeZero > 10) { // ~ 10 sec of shaking
        //    //    shake.stopWatch();
        //    //    trainNNbp(); // check prediction! then start bluchatting if yes. not training when used here => rename function
        //    //    shake.startWatch();
        //    //    timeZero = 0;
        //    //}
        //    /* will never get here! */
        //    //navigator.notification.alert('after interval loop code');

        //};
        //var onError = function () {
        //    navigator.notification.alert("accelerometer err");
        //};
        //shake.startWatch(onShake, 1, onError);

    }
    class NN {        
        constructor() {
           
        }
        static buildNN() {
           
        }
    }
    function guessQuake() {
        const { Layer, Network } = window.synaptic;
        var inputLayer = new Layer(1);
        var hiddenLayer = new Layer(50);
        var outputLayer = new Layer(1);

        inputLayer.project(hiddenLayer);
        hiddenLayer.project(outputLayer);
        var myNetwork = new Network({
            input: inputLayer,
            hidden: [hiddenLayer],
            output: outputLayer
        });
        //isTrained = false;
        //trainNNbp(accelTrainingData);
        prediction = myNetwork.activate(accelRealData);
        navigator.notification.alert("prediction (0..1): " + prediction);
    }  
    function getAccel(dataClass) {
        //var z = null;
        function onSuccess(acceleration) {
            //totalAccel = parseFloat(acceleration.x) + parseFloat(acceleration.x) + parseFloat(acceleration.z);
            //navigator.notification.alert('begin onSuccess'); //gets here
            totalAccel = Math.abs(acceleration.z);
            dataClass.push(totalAccel);
            //if (!isTrained) {
            //    dataClass.push(totalAccel);
            //}
            //if (isTrained) {
            //    accelRealData.push(totalAccel);
            //    //if (totalAccel > 625) { //ignore negative values // 25=5^2
            //    //    quakeCheckTriggered();
            //    //}
            //    //navigator.notification.alert('end shake check');
            //}
        }
        function onError() {
            navigator.notification.alert('Accel. Sensor Error!');
        }
        //if (isTrained) {

        navigator.accelerometer.getCurrentAcceleration(onSuccess, onError);
        //}
    }
    function trainNNbp() {
        
        const { Layer, Network } = window.synaptic;
        var inputLayer = new Layer(2);
        var hiddenLayer = new Layer(3);
        var outputLayer = new Layer(1);
        
        inputLayer.project(hiddenLayer);
        hiddenLayer.project(outputLayer);
        var myNetwork = new Network({
            input: inputLayer,
            hidden: [hiddenLayer],
            output: outputLayer
        });

        if (!isTrained) {
            //navigator.notification.alert('NOT trained');
            // collect data
            for (var i = 0; i < 1050; i++) {
                getAccel(accelTrainingData);
                document.getElementById("training").innerHTML += totalAccel + "<br>";
            }
            // train the network - learn XOR
            var learningRate = .8;
            //for (var i = 0; i < 1800; i++) {
            // 0,0 => 0
            myNetwork.activate(accelTrainingData);
            myNetwork.propagate(learningRate, [0]);
            //}
            navigator.notification.alert('done training!');
            isTrained = 1;
        }
        else {
            navigator.notification.alert('trained');
            prediction = myNetwork.activate(accelRealData);
            navigator.notification.alert("prediction (0..1): " + prediction);
            navigator.notification.alert("prediction (0..1): " + prediction);
            navigator.notification.alert("prediction (0..1): " + prediction);
            navigator.notification.alert("prediction (0..1): " + prediction);
            navigator.notification.alert("prediction (0..1): " + prediction);
            navigator.notification.alert("prediction (0..1): " + prediction);
            navigator.notification.alert("prediction (0..1): " + prediction);
            navigator.notification.alert("prediction (0..1): " + prediction);
            navigator.notification.alert("prediction (0..1): " + prediction);
        }
    }
    function setupTasks() {
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
            //permissions.BLUETOOTH,
            //permissions.BLUETOOTH_ADMIN,
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

        var cook = window.localStorage;
        firstRun = cook.getItem("firstRun");
        if ((firstRun == 1)) {
            navigator.notification.alert('firstrun!, addr= ' + thisAddr);
            localPhysicalAddr();

        }
        else {
            firstRun = 0;
            cook.setItem("firstRun", "0")
            //navigator.notification.alert('firstrun cookie set to 0');
        }

    }
    function localPhysicalAddr() {
        if (firstRun == 1) {
            navigator.notification.prompt(
                'Enter your address into the window. Your GPS coords will be added as well. \n Also, Are you a First Responder? (if Yes, you will collect unique emergency requests on your device)',  // message
                onPrompt,                  // callback to invoke
                'For First Responders',    // title
                ['Yes', 'No']              // buttonLabels
            );
            function onPrompt(results) { // when not firstreposnderr addr is blank on refresh
                if (results.buttonIndex == 1) {
                    var responderCook = window.localStorage;
                    var addrCook = window.localStorage;
                    responderCook.setItem("isResponder", "1");
                    addrCook.setItem("addr", thisAddr + results.input1);
                }
                else {
                    var responderCook2 = window.localStorage;
                    var addrCook2 = window.localStorage;
                    responderCook2.setItem("isResponder", "0");
                    addrCook2.setItem("addr", thisAddr + results.input1);
                }
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
    function getHorizFreq() {
        return hFreq;
    }  
    var tmp = 0;    
    function fail(e) {
        console.log("FileSystem Error");
        console.dir(e);
    }    
    function gotFile(fileEntry) {

        fileEntry.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function (e) {
                navigator.notification.alert("Text is: " + this.result);
                //document.querySelector("#textArea").innerHTML = this.result;
            }
            reader.readAsText(file);
        });

    }
    function readFile(fileEntry) {

        fileEntry.file(function (file) {
            var reader = new FileReader();

            reader.onloadend = function () {
                navigator.notification.alert("Successful file read: " + this.result);
                displayFileData(fileEntry.fullPath + ": " + this.result);
            };

            reader.readAsText(file);

        }, onErrorReadFile);
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
        //gpsDetect.switchToLocationSettings(onSwitchToLocationSettingsSuccess, onSwitchToLocationSettingsError);  
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
                                document.getElementById("deviceProperties").style.font = "italic bold 10px arial,serif";
                                document.getElementById("deviceProperties").innerHTML += "{ " + device_names[key] + " }";  // "{" + broadCastHist[key] + "}" + "<br />"; 
                               
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
})(); // self executing, private scope function