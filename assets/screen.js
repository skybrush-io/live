
//in:"20160201.012509", we got this from server


var App = {};

App.trigger = function(what,xtra) {

	$(document).trigger(what,xtra);

};
App.venues = {

	Clark	: {lat:47.4984,lon:19.0407},
	ELTE	: {lat:47.4739,lon:19.0610},

};
App.config = {

	socketHost		: "ws://flockwave.collmot.com",
	socketStream	: "fw",
	droneIcon		: "assets/drone.32x32.w.png",
	mapStart		: App.venues.ELTE,

};
App.currentFlock = 0; // will be an object later
App.serverConnection = {

	socket : 0,
	start: function() {
	    var c = App.config;
		this.socket = io(c.socketHost);
		this.socket.on(c.socketStream,function(data) {

			var drones = data.body.status;

			if(!App.currentFlock) return;

			for(var i in drones) {
				
				var d = drones[i];
				var name = drones[i].id;
				var pLat = drones[i].position.lat;
				var pLon = drones[i].position.lon;
				App.currentFlock.put(name,pLat,pLon);
				
				App.terminal.write(drones[i].timestamp + " :: "+name+" is at ["+pLat+":"+pLon+"]\n");
				
			}
			App.terminal.write("\n");

		});

		this.socket.emit(c.socketStream,{
		    "$fw.version": "1.0",
		    "id": guid(),
		    "body":JSON.stringify(
				{
				    "type": "UAV-INF",
				    "ids": [
				        "FAKE-00",
				        "FAKE-01",
				        "FAKE-02"
				    ]
				}
		    ),
		});

		App.terminal.write("server communication started\n");
	},
	stop: function() {
		this.socket.disconnect();
	},

};
App.googleMap = {

	box: "",
	init: function(startPos) {

		this.box = $("#venue-map");

		this.box.gmap3({
			map:{
				options:{
					"center"	: [startPos.lat,startPos.lon],
					"zoom"		: 17,
					"mapTypeId"	: google.maps.MapTypeId.TERRAIN
				}
			},
		});
		
		App.terminal.write("google map init ok\n");

	},
	setMarker: function(x) {
		return this.box.gmap3({marker:x});
	},
	getMarker: function(markerID) {
		return this.box.gmap3({get:{id:markerID}});
	},


};
App.terminal = {

	box: 0,
	pfx: "",
	init: function() {
		this.box=$(".underbar");
	},
	write: function(x) {
		if(!this.box) this.init();
		var display = this.box;
		var h = display.html();
		if(h.length>10000) {
			h = h.substr(-10000);
			h = h.replace(/^.*\n/,"");
		}
		h+=this.pfx+x;
		display.html(h);
		display.scrollTop(999999);
	},
	prefix: function(x) {
		this.pfx = x;
	},

};
App.init = function() {

	App.terminal.write("Initializing ...\n");
	App.terminal.prefix(" - ");
	
	App.currentFlock = new Flock();
	App.googleMap.init(App.config.mapStart);
	App.serverConnection.start();
	
	App.terminal.prefix("");
	App.terminal.write("Done\n\n");

};


function Flock() { // creates a flock instance

	this.count = function() {

		var n = 0;for(var i in this.drones) ++n;
		return n;

	};
	this.drones = {};
	this.newbie = function(name) {

		return {
			"name"	: name,
			"lat"	: App.venues.ELTE.lat,
			"lon"	: App.venues.ELTE.lon,
			"icon"	: App.config.droneIcon,
		};

	};
	this.put = function(name,lat,lon) {

		var d = this.drones;

		// create it if we don't know the name
		if(typeof(d[name])=="undefined") {

			var p = this.newbie(name);
			var mkid = "Drone_"+name; // allows pure numeric names
			App.googleMap.setMarker({
				id		: mkid,
				latLng	: {lat:p.lat,lng:p.lon},
				options	: {icon:p.icon}
			});
			p.marker = App.googleMap.getMarker(mkid);
			d[name] = p;
			App.trigger("numberOfDronesChanged",this.count());

		}
		var p = d[name];

		var moved = 1;if(p.lat==lat)if(p.lon==lon)moved=0;
		if(!moved) return;

		p.lat = lat;
		p.lon = lon;

		p.marker.setPosition({lat:p.lat,lng:p.lon});

	};

	App.terminal.write("flock instance created\n");
	return this;

};



// misc helpers

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}




$(function() {

	App.init();

	$(document).on("numberOfDronesChanged",function(e,n) {
		$(".direct-buttons").find("button").each(function() {
			var e = (n-->0)?1:0;
			if(e==1) $(this).removeClass("disabled").addClass("enabled" );
			if(e==0) $(this).removeClass("enabled" ).addClass("disabled");
		});
	});

});

