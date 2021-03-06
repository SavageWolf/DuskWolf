//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("example.saybox", function() {
	load.require("dusk.sgui.SayBox");
	var dusk = load.require("dusk");
	var c = load.require("dusk.sgui.c");
	var sgui = load.require("dusk.sgui");
	var FancyRect = load.require("dusk.sgui.FancyRect");
	var FpsMeter = load.require("dusk.sgui.FpsMeter");
	var Runner = load.require("dusk.script.Runner");
	
	// Apply styles
	sgui.addStyle("SayBox>PlusText", {
		"plusType":"FancyRect",
		"plus":{
			"back":"fancyRect/back.png",
			"top":"fancyRect/top.png",
			"bottom":"fancyRect/bottom.png",
			"left":"fancyRect/left.png",
			"right":"fancyRect/right.png",
			"topLeft":"fancyRect/topLeft.png",
			"topRight":"fancyRect/topRight.png",
			"bottomLeft":"fancyRect/bottomLeft.png",
			"bottomRight":"fancyRect/bottomRight.png",
		},
		"label":{
			"borderColour":"#ffffff",
			"borderSize":0,
			"colour":"#ffffff",
			"size":16,
			"font":"sans"
		}
	});
	
	// Draw GUI
	sgui.get("default", true).update({
		"focus":"say",
		"active":true,
		"children":{
			"say":{
				"type":"SayBox",
				"yOrigin":"bottom",
				"xOrigin":"middle",
				"children":{
					"right":{
					},
					"left":{
					},
					"body":{
					}
				}
			},
			
			"meter":{
				"type":"FpsMeter",
				"xOrigin":"right",
				"visible":false,
			},
		},
	});
	
	// Create speakers
	var h = sgui.path("default:/say").runnerSayAction.bind(sgui.path("default:/say"), "Lord St. Heroingston");
	var c = sgui.path("default:/say").runnerSayAction.bind(sgui.path("default:/say"), "\"Wounded\" Child");
	
	// Say stuff
	(new Runner([
		h("THIS CHILD IS WOUNDED!aosehusaoceuhasorcehusacoehu saoechu lraoechu laoerc huaolrec uhalorhue laroh ueclrao heulrach ulacho eulrach lreach ularch eularoche ulraoche ulaorech ularhu laorhue lrahc ularo hela huacuehlauhe aloecuh laroechu laochu laorech ulah ulaohue "),
		c("What? No I'm not."),
		h("Give this child a healing potion?", "[img item.png][/img] - 15"),
		function(pa) {
			if(!("sayVars" in pa)) pa.sayVars = {};
			
			pa.sayVars.no = ""+(~~(Math.random() * 1000));
			return pa;
		},
		h("You are now [b]{{no}}[/b] in the healing queue! That is [b]{{no}}[/b]!\nThanks for waiting!", "", "sayVars"),
		function() {
			sgui.path("default:/say").updateExtra("fadeOut", {
				"type":"Fade",
				"on":true,
				"duration":60,
				"from":1.0,
				"to":0.0,
			});
		}
	])).start({}).catch(console.error.bind(console));
	
	// And begin
	dusk.startGame();
	
	return {};
});
