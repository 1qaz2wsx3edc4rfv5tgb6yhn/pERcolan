pERcolan

pERcolan - Peer Emergency Communications Outside of Linked Area Networks

Lawrence Sweet Peer EmeRgency Communications Outside of Linked Area Networks - PEERCOLAN - "Bluetooth Help beacons (in urban environments), with address and/or other locating information, when Cellular/Internet are down after a natural disaster" PERC beta v0.5 idea copyright 2016 - 2017

usage: uses a bluetooth name as an emergency beacon, after a (natural) disaster, to other bluetooth devices with your address and other data relevant to your rescue. if bluetooth peers in range also have the PERC client, you will be (randomly) "paired" (not in bluetooth sense) to a PERC peer at which point: You and your peer will set each others bluetooth name as your own, and, at setintervals, this will continue until your rescue beacon has permeated 100m-contiguous PERC clients which may or may not be able to assist (upon receiving your address/txtmsg) or may be a fire, police, etc associated PERC installed cell/bluetooth (android) device.

this app requires MacroDroid (free) + imported actions file: reason PERC cannot programmatically perform bluetooth share service cache clearance (root required) , but Macrodroid action recorder for android handles that with this importable action file: https://drive.google.com/open?id=0B9G6-6K0q4geTDdsd3ZzM296cHM ...that stops/restarts bluetooth share service where bluetooth names are cached (and seem to get stale consistently hence this workaround)

5 * 0.1 items todo:

read file based default emergency beacon message from device and set that = this.name
impose any needed de-spamm filter to prevent peer saturation and deadlock/instability
add sensor data that may be relevant, including auto-load when vibration/Delta(spatial)/etc => earthquake, severe collision, and...?
refactor while loop/etc into synchronous calls of async 'tooth functions
switch only with beacons carrying the 'perc token' = "+"