pERcolan

pERcolan - Peer Emergency Communications Outside of Linked Area Networks

Lawrence Sweet Peer EmeRgency Communications Outside of Linked Area Networks - PERCOLAN - "Bluetooth Help beacons (in urban environments), with address and/or other locating information, when Cellular/Internet are down after a natural disaster" PERC beta v0.6 idea copyright 2015 - 2017

usage: uses a bluetooth name as an emergency beacon, after a (natural) disaster, to other bluetooth devices with your address and other data relevant to your rescue. 

if bluetooth peers in range also have the PERC client, you will be (randomly) "paired" (not in bluetooth sense) to a PERC peer at which point: You and your peer will set each others bluetooth name as your own [name switching forms the p2p route mechanics], and, at setintervals, this will continue until your rescue beacon has permeated 100m-contiguous PERC clients which may or may not be able to assist (upon receiving your address/txtmsg) or may be a fire, police, etc associated PERC installed cell/bluetooth (android) device.

Clients will be able to set what coded instructions in a pERc message to look for, i.e, a fire station pERc client will automatically respond and alert the bearer if the pERc message contains the code that means somebody is buried in rubble, for instance. These codes will cache on all pERc clients, and any client will have an easy to initiate, or automatic, code sent out to the pERcnet depending upon victim action and/or sensor data from victim.

[] 2nd p2p routing option: Network saturation prevention - a planned feature; this code branch is not implementing the "group" idea simulated in "pERcolan/percolate-p2p-sim.html", which has saturation prevention built in.

[] 3rd p2p routing option: "Embedded Bifurcation Of Address Routing (EBOAR)" details to come asap. Uses local designation of node addresses (logistic output at sufficiently high n=iteration number so that # cycles >> number of nodes in local/emergency scope community) where address if logistic recursion of n and branch selection/routing is done at every peer which selects next upper branch if incoming address/logistic output < desired/destination, and vice versa.  

this app requires MacroDroid (free) + imported actions file: reason PERC cannot programmatically perform bluetooth share service cache clearance (root required) , but Macrodroid action recorder for android handles that with this importable action file: https://drive.google.com/open?id=0B9G6-6K0q4geTDdsd3ZzM296cHM ...that stops/restarts bluetooth share service where bluetooth names are cached (and seem to get stale consistently hence this workaround)

4 * 0.1 items todo:

* read file based default emergency beacon message from device and set that = this.name and add msg to queue.
* impose any needed de-spam filter to prevent peer saturation and deadlock/instability (see "pERcolan/percolate-p2p-sim.html") file.
* add sensor data and victim signaling including auto-load when vibration/Delta(spatial)/etc => earthquake, severe collision, and...?
* switch only with beacons carrying the 'perc token' = "+"
