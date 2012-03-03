//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: mods.Data
 * 
 * This allows you to download more JSONS, and prefetch images.
 * 
 * Inheritance:
 * 	mods.Data { <mods.IModule>
 * 
 * Provided Actions:
 * 
 * > {"a":"import", "file":"...", ("thread":"...")}
 * Downloads a JSON from a file relative to the data dir, and runs it.
 * 	The file extension ".json" is added automatically.
 * 	The actions will be ran on <Events.thread>, the current thread, if the thread property is not specified.
 * 
 * > {"a":"fetch", "file":"..."}
 * Downloads the specified image in the background, allowing it to appear instantly when needed.
 * 
 */

/** Function: mods.LocalSaver
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything else of interest though.
 * 
 * Params:
 *	events	- [<Events>] The events system that this will be used for.
 */
mods.Data = function(events) {
	mods.IModule.call(this, events);
};
mods.Data.prototype = new mods.IModule();
mods.Data.constructor = mods.Data;

/** Function: addActions
 * 
 * Registers the actions and sets the vars this uses, see the class description for a list of avalable ones.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
mods.Data.prototype.addActions = function() {
	this._events.registerAction("import", this._get, this);
	this._events.registerAction("fetch", this._get, this);
};

/** Function: _get
 * 
 * Used internally to handle both "get" like actions.
 * 	You should use the standard ways of running actions, or the <Data> class rather than calling this directly.
 * 
 * Params:
 *	data		- [object] A "import" or "fetch" action.
 * 
 * See:
 * * <Data>
 */
mods.Data.prototype._get = function(action) {
	if(!action.file){duskWolf.error("No file to retreive.");return;}
	
	if(action.a === "import") {
		this._events.run(data.grabJson(action.file), action.thread?action.thread:this._events.thread);
	}else{
		data.grabImage(action.file);
	}
};
