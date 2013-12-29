//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");

dusk.load.provide("dusk.sgui.ParticleField");

/** @class dusk.sgui.ParticleField
 * 
 * @classdesc 
 * 
 * @param {dusk.sgui.IContainer} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * @extends dusk.sgui.Component
 * @constructor
 */
dusk.sgui.ParticleField = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
	
	//[r+g, b+a, x, y, xscratch+dx, yscratch+dy, dxscratch+ddx, dyscratch+ddy, dxlimit+dylimit, lifespan, dalphadecay]
	this._field = null;
	
	this._highest = 0;
	this._pixels = 0;
	this.stat = false;
	
	//Prop masks
	
	//Listeners
	this.prepareDraw.listen(this._pfDraw, this);
	this.frame.listen(this._pfFrame, this);
	
	//Render support
	this.renderSupport |= dusk.sgui.Component.REND_OFFSET | dusk.sgui.Component.REND_SLICE;
	
	this.createField(1 << 16);
};
dusk.sgui.ParticleField.prototype = Object.create(dusk.sgui.Component.prototype);

dusk.sgui.ParticleField.prototype.className = "ParticleField";

dusk.sgui.ParticleField.prototype._pfFrame = function(e) {
	for(var i = 0; i <= this._highest; i += 11) {
		if((this._field[i+1] & 0x00ff) != 0) {
			//Dx and dy
			this._field[i+4] += Math.abs((this._field[i+4] & 0xff) - 0x80) << 8;
			this._field[i+5] += Math.abs((this._field[i+5] & 0xff) - 0x80) << 8;
			
			this._field[i+2] += (this._field[i+4] >> 13) * (this._field[i+4] & 0x80 ? 1 : -1);
			this._field[i+3] += (this._field[i+5] >> 13) * (this._field[i+5] & 0x80 ? 1 : -1);
			
			this._field[i+4] &= 0x1fff;
			this._field[i+5] &= 0x1fff;
			
			//Ddx and ddy
			this._field[i+6] += Math.abs((this._field[i+6] & 0xff) - 0x80) << 8;
			this._field[i+7] += Math.abs((this._field[i+7] & 0xff) - 0x80) << 8;
			
			this._field[i+4] += (this._field[i+6] >> 14) * (this._field[i+6] & 0x80 ? 1 : -1);
			this._field[i+5] += (this._field[i+7] >> 14) * (this._field[i+7] & 0x80 ? 1 : -1);
			
			this._field[i+4] &= 0x3fff;
			this._field[i+5] &= 0x3fff;
			
			//Limits
			if((this._field[i+6] & 0xff) != 0x80
			&& ((((this._field[i+6] & 0x80)) && ((this._field[i+4] & 0xff) > (this._field[i+8] >> 8)))
			  || ((!(this._field[i+6] & 0x80)) && ((this._field[i+4] & 0xff) < (this._field[i+8] >> 8)))
			))
				this._field[i+4] = (this._field[i+8] >> 8) | (this._field[i+4] & 0xff00);
			
			if((this._field[i+7] & 0xff) != 0x80
			&& ((((this._field[i+7] & 0x80)) && ((this._field[i+5] & 0xff) > (this._field[i+8] & 0xff)))
			  || ((!(this._field[i+7] & 0x80)) && ((this._field[i+5] & 0xff) < (this._field[i+8] & 0xff)))
			))
				this._field[i+5] = (this._field[i+8] & 0xff) | (this._field[i+5] & 0xff00);
			
			//Lifespan and alpha decay
			if(this._field[i+9] > 0) {
				this._field[i+9] --;
			}else{
				if(this._field[i+10] > (this._field[i+1] & 0xff)) {
					this._field[i+1] = 0;
				}else{
					this._field[i+1] -= this._field[i+10];
				}
			} 
		}
	}
	
	return e;
};

dusk.sgui.ParticleField.prototype._pfDraw = function(e) {
	var c = null;
	//if(this._highest > (10000 * 11)) var c = e.c.getImageData(e.d.destX, e.d.destY, e.d.width, e.d.height);
	
	//if(this.stat) for(var i = c.data.length -1; i >= 0; i --) {
	//	//c.data[i] = Math.random() * 256;
	//	e.c.fillStyle = ("#"+~~(Math.random() * (1 >> 16))).toString("16");
	//}
	
	for(var i = 0; i <= this._highest; i += 11) {
		if((this._field[i+1] & 0x00ff) != 0) {
			var translatedX = this._field[i+2] - e.d.sourceX;
			var translatedY = this._field[i+3] - e.d.sourceY;
			
			if(this._field[i+2] >= e.d.sourceX && this._field[i+3] >= e.d.sourceY
			&& this._field[i+2] <= e.d.width && this._field[i+3] <= e.d.height) {
				if(c) {
					var origin = (translatedX + (translatedY * e.d.width)) * 4;
					c.data[origin] = this._field[i] >> 8;
					c.data[origin+1] = this._field[i] & 0xff;
					c.data[origin+2] = this._field[i+1] >> 8;
					c.data[origin+3] = this._field[i+1] & 0xff;
				}else{
					e.c.fillStyle =
					"rgba(" + (this._field[i] >> 8) + ", " + (this._field[i] & 0xff) + ", " +
					(this._field[i+1] >> 8) + ", " + (this._field[i+1] & 0xff) * (1/256) + ")";
				
					e.c.fillRect(translatedX, translatedY, 1, 1);
				}
			}
		}else if(this._highest == i) {
			this._highest -= 11;
		}
	}
	
	if(c) e.c.putImageData(c, e.d.destX, e.d.destY);
	
	return e;
};

dusk.sgui.ParticleField.prototype.inject =
	function(r, g, b, a, x, y, dx, dy, ddx, ddy, dxlimit, dylimit, lifespan, decay) {
	if(a == 0) return;
	
	for(var i = 0; i < this._pixels; i += 11) {
		if((this._field[i+1] & 0x00ff) == 0) {
			if(i > this._highest) this._highest = i;
			this._field[i] = (r << 8) | g;
			this._field[i+1] = (b << 8) | a;
			this._field[i+2] = x;
			this._field[i+3] = y;
			this._field[i+4] = (dx * 0x20) + 0x80;
			this._field[i+5] = (dy * 0x20) + 0x80;
			this._field[i+6] = (ddx * 0x40) + 0x80;
			this._field[i+7] = (ddy * 0x40) + 0x80;
			this._field[i+8] = (((dxlimit * 0x20) + 0x80) << 8) + ((dylimit * 0x20) + 0x80);
			this._field[i+9] = lifespan;
			this._field[i+10] = decay;
			break;
		}
	}
}

dusk.sgui.ParticleField.prototype.createField = function(pixels) {
	this._field = new Uint16Array(pixels * 11);
	this._highest = 0;
	this._pixels = pixels * 11;
};

dusk.sgui.ParticleField.prototype.deRange = function(val, def) {
	if(Array.isArray(val)) {
		return (Math.random()*(val[1]-val[0])) + val[0];
	}else if(val === null || val === undefined) {
		return this.deRange(def);
	}
	
	return val;
};

dusk.sgui.ParticleField.prototype.applyEffect = function(name, data) {
	data.name = name;
	if(name in dusk.sgui.effects) {
		dusk.sgui.effects[name](this, data);
	}else{
		console.warn("Effect "+name+" not found!");
	}
};

dusk.sgui.ParticleField.prototype.loadBM = function(data) {};
dusk.sgui.ParticleField.prototype.saveBM = function() {return {}};

dusk.sgui.effects = {};

Object.seal(dusk.sgui.ParticleField);
Object.seal(dusk.sgui.ParticleField.prototype);

dusk.sgui.registerType("ParticleField", dusk.sgui.ParticleField);