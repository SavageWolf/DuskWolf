//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui");
dusk.load.require("dusk.sgui.BasicMain");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.entities");
dusk.load.require("dusk.RoomManager");
dusk.load.require("dusk.skills");

dusk.load.provide("dusk.plat");

/** @namespace dusk.plat
 * @name dusk.plat
 * 
 * @description Plat is a simple platforming engine that uses `{@link dusk.sgui}`.
 * 
 * Importing this package will automatically set up a pane and stuff that a platformer can be used in.
 */
 
/** Initiates this, setting up all the variables.
 *
 * @private
 */
dusk.plat._init = function() {
	//Default skills
	dusk.skills.giveSkill("jump");
	dusk.skills.giveSkill("dubjump");
	//dusk.skills.giveSkill("infinijump");
	
	var main = dusk.sgui.getPane("plat");
	main.modifyComponent([{"name":"main", "type":"BasicMain", "width":-2, "height":-2}]);
	main.becomeActive();
	main.flow("main");
	
	main.getComponent("main").layers = [
		{"name":"back", "type":dusk.sgui.BasicMain.LAYER_TILEMAP},
		{"name":"scheme", "type":dusk.sgui.BasicMain.LAYER_SCHEME},
		{"name":"entities", "type":dusk.sgui.BasicMain.LAYER_ENTITIES, "primary":true},
		{"name":"parts", "type":dusk.sgui.BasicMain.LAYER_PARTICLES},
		{"name":"over", "type":dusk.sgui.BasicMain.LAYER_TILEMAP}
	];
	
	dusk.entities.types.createNewType("plat", {
		"data":{
			"hp":1, "gravity":2, "terminal":7, "haccel":2, "hspeed":7, "jump":15, "slowdown":1,
			"img":"pimg/hero.png", "solid":true, "anchor":false, "collides":true
		},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	});
	
	dusk.plat.rooms = new dusk.RoomManager("dusk.plat", "dusk.plat.rooms");
	dusk.plat.rooms.setBasicMain(main.getComponent("main"));
};

dusk.plat._init();

Object.seal(dusk.plat);
