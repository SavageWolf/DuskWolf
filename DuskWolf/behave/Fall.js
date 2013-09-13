//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Fall");

/** @class dusk.behave.Fall
 * 
 * @classdesc An entity with this behaviour will move down a number of pixels
 *  specified by the `fallSpeed` data property when landed on.
 * 
 * If this value is lower that the speed the entity is falling at,
 *  it will appear as if the entity is standing on top of this.
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.Fall = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._data("fallSpeed", 1, true);
		
		this.entityEvent.listen(this._fallFall, this, {"name":"collidedInto", "dir":dusk.sgui.c.DIR_UP});
	}
};
dusk.behave.Fall.prototype = Object.create(dusk.behave.Behave.prototype);

/** Used to manage collisions internally.
 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.Fall.prototype._fallFall = function(name, e) {
	//this._entity.performMotion(0, this._entity.eProp("fallSpeed"));
	this._entity.applyDy("fall_fall", 1/*this._data("fallSpeed")*/);
};

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.Fall.workshopData = {
	"help":"Will fall when collided with.",
	"data":[
		["fallSpeed", "integer", "The speed to fall."]
	]
};

Object.seal(dusk.behave.Fall);
Object.seal(dusk.behave.Fall.prototype);

dusk.entities.registerBehaviour("Fall", dusk.behave.Fall);
