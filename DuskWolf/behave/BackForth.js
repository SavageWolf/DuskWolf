//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.BackForth");

/** @class dusk.behave.BackForth
 * @memberof dusk.behave
 * 
 * @classdesc An entity with this behaviour will move in one direction
 *  until it collides with something, and then head the other direction.
 * 
 * The speed it travels at is defined by the behaviour data value `"hspeed"`. Which is `1` by default.
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.BackForth = function(entity) {
	dusk.behave.Behave.call(this, entity);
		
	this._data("hspeed", 1, true);
	
	this.entityEvent.listen(this._bfCollide, this, {"name":"collide"});
	
	this._entity.applyDx("bf_move", this._data("hspeed"));
	window.hook = this;
};
dusk.behave.BackForth.prototype = Object.create(dusk.behave.Behave.prototype);

/** Used to manage collisions internally.
 * @param {object} e A "collide" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.BackForth.prototype._bfCollide = function(e) {
	if(e.dir == dusk.sgui.c.DIR_LEFT) {
		this._entity.applyDx("bf_move", this._data("hspeed"));
	}
	if(e.dir == dusk.sgui.c.DIR_RIGHT) {
		this._entity.applyDx("bf_move", -this._data("hspeed"));
	}
};

Object.seal(dusk.behave.BackForth);
Object.seal(dusk.behave.BackForth.prototype);

dusk.entities.registerBehaviour("BackForth", dusk.behave.BackForth);
