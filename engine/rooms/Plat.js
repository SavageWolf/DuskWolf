//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.plat", (function() {
	var sgui = load.require("dusk.sgui");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var entities = load.require("dusk.entities");
	var RoomManager = load.require("dusk.rooms.RoomManager");
	var TileMapWeights = load.require("dusk.tiles.sgui.TileMapWeights");
	var skills = load.require("dusk.skills");
	
	/** Plat is a simple platforming engine that uses `dusk.sgui`.
	 * 
	 * Use `make` to add a child to a component to have a platformer engine run in it.
	 * @implements dusk.save.ISavable
	 */
	var plat = {};
	
	//Default skills
	skills.giveSkill("jump");
	skills.giveSkill("dubjump");
	//skills.giveSkill("infinijump");
	
	entities.types.createNewType("plat", {
		"data":{
			"headingLeft":false, "headingUp":false,
			"src":"pimg/hero.png", "solid":true, "collides":true
		},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	});
	
	plat.rooms = new RoomManager("dusk.rooms.plat", "rooms");
	
	plat.make = function(component, name) {
		component.modifyComponent(
			[{"name":name, "type":"LayeredRoom", "scrollInstantly":true, "margins":[10, 10, 10, 10], "mark":"#00ffff",
				"allowMouse":true
			}]
		);
		component.becomeActive();
		component.flow(name);
		plat.rooms.setLayeredRoom(component.get(name));
	}
	
	plat.save = function(type, args, ref) {
		if(this.rooms.basicMain.getSeek() && type == "roomAndSeek") {
			return [this.rooms.basicMain.roomName, this.rooms.basicMain.getSeek().x, this.rooms.basicMain.getSeek().y];
		}else if(type == "roomOnly" || type == "roomAndSeek"){
			return [this.rooms.basicMain.roomName];
		}else{
			throw TypeError("Type must be either 'roomAndSeek' or 'roomOnly', got "+type);
		}
	};
	
	plat.load = function(data, type, args, unref) {
		if(data.length > 1) {
			return this.rooms.basicMain.createRoom(data[0], [data[1], data[2]]);
		}else{
			return this.rooms.basicMain.createRoom(data[0]);
		}
	};
	
	return plat;
})());
