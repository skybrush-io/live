
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
App.stats = {

    time: {
    
    	connected: 0,
    	lastpacket: 0,
    	
    	swZero  : 0,
    	get     : function() {return new Date().getTime();},
    	zero    : function() {App.stats.time.swZero = App.stats.time.get();},
    	elapsed : function() {return App.stats.time.get()-App.stats.time.swZero;},
    	
    },
    packets: {
    
    	sent : 0,
    	recv : 0,
    	
    	zero: function() {
    		App.stats.packets.sent=0;
    		App.stats.packets.recv=0;
    	},
    	
    },
    
    fps: function() {
    	
    	var f = App.stats.packets.recv;
    	var s = App.stats.time.elapsed() / 1000;
    	var fps = f/s; // ;) textbook mdfkz
    	fps = Math.round(fps);
    	return fps;
    
    },
    reset: function() {
    	App.stats.time.zero();
    	App.stats.packets.zero();
    },

	displayFreq: 100, // ms between updates
	display: function() {
	
    	var me = App.stats;
    	var fps = me.fps();
    	var fpsBar = String("lllllllllllllllllllllllllllllllllll").substr(0,fps);
		document.getElementById("packet-sent").innerHTML = me.packets.sent;
		document.getElementById("packet-recv").innerHTML = me.packets.recv;
		document.getElementById("framepersec").innerHTML = fps;
		document.getElementById("fps-bar"    ).innerHTML = fpsBar;
	
	},
    live: function(sw) {
    	
    	var me = App.stats;
    	
    	if(sw=="on" ) sw=1;
    	if(sw=="off") sw=0;
    	
    	if(sw==1) if(!me.displayHandle) {me.displayHandle = setInterval(me.display,me.displayFreq);}
    	if(sw==0) if( me.displayHandle) {clearInterval(App.stats.displayHandle);me.displayHandle=0;}
    	
    },
	
};
App.serverConnection = {

	socket : 0,
	start: function() {
	    var c = App.config;
		this.socket = io(c.socketHost);
		this.socket.on(c.socketStream,function(data) {
		
			App.stats.packets.recv++;

			var drones = data.body.status;

			if(!App.currentFlock) return;

			for(var i in drones) {
				
				var d = drones[i];
				if (typeof d === undefined)
					continue;

				var name = d.id;
				var pLat = d.position.lat;
				var pLon = d.position.lon;
				App.currentFlock.put(name,pLat,pLon);
				
				// App.terminal.write(drones[i].timestamp + " :: "+name+" is at ["+pLat+":"+pLon+"]\n");
				
			}
			// App.terminal.write("\n");
			

		});

		App.stats.packets.sent++;
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

	App.stats.reset();	
	App.currentFlock = new Flock();
	App.googleMap.init(App.config.mapStart);
	App.serverConnection.start();
	
	App.terminal.prefix("");
	App.terminal.write("Done\n\n");
    
    setTimeout(function() {
		App.stats.reset();	
		App.stats.live("on");
	},200);

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

