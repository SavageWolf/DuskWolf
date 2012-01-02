//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: mods.Plat
 * 
 */

/** Function: mods.Plat
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything of interest though.
 */
mods.Plat = function(events) {
	mods.IModule.call(this, events);
	
	//Vars
	this._events.setVar("plat-gravity", 1.5);
	this._events.setVar("plat-jump", 17);
	this._events.setVar("plat-terminal", 10);
	this._events.setVar("plat-slowdown", 2);
	this._events.setVar("plat-speed", 10);
	this._events.setVar("plat-accel", 4);
	
	this._events.setVar("plat-skill-jump", true);
	this._events.setVar("plat-skill-dubjump", true);
	
	this._events.run([
	{"a":"listen", "event":"sys-event-load", "actions":[
		{"a":"pane", "name":"plat-main", "children":[
			{"name":"main", "type":"PlatMain"}
		]}
	]}], "_plat");
};
mods.Plat.prototype = new mods.IModule();
mods.Plat.constructor = mods.Plat;

/** Function: addActions
 * 
 * Registers the actions this uses, see the class description for a list.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
mods.Plat.prototype.addActions = function() {
	this._events.registerAction("plat-room", this._setRoom, this);
};

mods.Plat.prototype._setRoom = function(dat) {
	if(!("room" in dat)){duskWolf.error("No room to load.");return;}
	
	duskWolf.info("Setting room "+dat.room+".");
	this._events.run(data.grabJson("prooms/"+dat.room.replace(/\-/g, "_")), this._events.thread);
	this._events.run([
		{"a":"unlisten", "event":"plat-mark"},
		{"a":"sg-path", "path":"plat-main.main", "load":{"room":dat.room, "spawn":dat.spawn}},
		{"a":"call", "name":"plat-post-"+dat.room}], this._events.thread);
};
