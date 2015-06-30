//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.Volatile", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");

	/** @class dusk.entities.behave.Volatile
	 * @memberof dusk.entities.behave
	 * 
	 * @classdesc An entity with this behaviour will be terminated when it collides with a specific entity or a wall.
	 * 
	 * The entity it collides with must match a function (i.e. make it return true) specified by the behaviour property
	 * `"killedBy"`. If this function is absent, then any collision will terminate it.
	 * 
	 * @extends dusk.entities.behave.Behave
	 * @param {?dusk.entities.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var Volatile = function(entity) {
		Behave.call(this, entity);
		
		this.entityEvent.listen(this._vCollide.bind(this), "collide");
	};
	Volatile.prototype = Object.create(Behave.prototype);

	/** Used to manage collisions internally.
	 * @param {object} e A "collide" event dispatched from `{@link dusk.entities.behave.Behave.entityEvent}`.
	 * @private
	 */
	Volatile.prototype._vCollide = function(e) {
		if(this._data("killedBy") && !this._data("killedBy")(e.target, this._entity)) return;
		
		this._entity.terminate();
	};

	/** Workshop data used by `{@link dusk.entities.sgui.EntityWorkshop}`.
	 * @static
	 */
	Volatile.workshopData = {
		"help":"Will be removed if it hits a wall or entity.",
		"data":[
			["killedBy", "string", "A trigger that is true for all entities that can remove this on collision.", "\"\""]
		]
	};

	Object.seal(Volatile);
	Object.seal(Volatile.prototype);

	entities.registerBehaviour("Volatile", Volatile);
	
	return Volatile;
})());
