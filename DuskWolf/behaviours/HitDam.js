//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.HitDam");

dusk.behave.HitDam = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._data("damage", 1, true);
		
		this._listenEvent("collidedInto", this._hdCollide);
		this._listenEvent("collide", this._hdCollide);
	}
};
dusk.behave.HitDam.prototype = new dusk.behave.Behave();
dusk.behave.HitDam.constructor = dusk.behave.HitDam;

dusk.behave.HitDam.prototype._hdCollide = function(event, e) {
	if(e.target === "wall") return;
	e.target.behaviourFire("takeDamage", {"damage":this._data("damage"), "source":this._entity});
};
