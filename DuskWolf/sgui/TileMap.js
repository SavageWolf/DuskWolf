//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");
dusk.load.require("dusk.data");

dusk.load.provide("dusk.sgui.TileMap");

/** @class dusk.sgui.TileMap
 * 
 * @classdesc This is a lot of tiles arranged in a grid.
 * 
 * This can be thought of as a lot of `{@link dusk.sgui.Tile}` instances arranged in a grid,
 *  but for practical reasons this is not how it is implemented.
 * 
 * Each tile on the grid has a coordinate, where the tile at the upper left is at (0, 0),
 *  and the next one to the right is (1, 0) and so on.
 * 
 * The tilemap must be drawn completley before it can be used, hence changing any tile
 *  and especially changing the dimensions of the tilemap is a really expensive operation.
 *
 * Only part of the tilemap is visible, as described by the `*bound` properties, and this will be the only area drawn.
 * 
 * @extends dusk.sgui.Component
 * @param {?dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * @constructor
 */
dusk.sgui.TileMap = function (parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
		
		/** The current mode of tiles in the tilemap. Must be either `"BINARY"` or `"DECIMAL"`.
		 * @type string
		 * @default "BINARY"
		 */
		this.mode = "BINARY";
		
		
		/** The width (for displaying) of a single tile if this tilemap is in `"DECIMAL"` mode.
		 * @type integer
		 * @default 32
		 */
		this.twidth = 32;
		/** The height (for displaying) of a single tile if this tilemap is in `"DECIMAL"` mode.
		 * @type integer
		 * @default 32
		 */
		this.theight = 32;
		/** The size (for displaying) of a single tile if this tilemap is in `"BINARY"` mode.
		 * 
		 * This should be `n` such that the width and height of the sprite is `2^n`.
		 *  If this is 4, then the sprites will be 16x16, for example.
		 * @type integer
		 * @default 5
		 */
		this.tsize = 5;
		
		/** The width (for reading from the image) of a single tile if this tilemap is in `"DECIMAL"` mode.
		 * @type integer
		 * @default 16
		 */
		this.swidth = 16;
		/** The height (for reading from the image) of a single tile if this tilemap is in `"DECIMAL"` mode.
		 * @type integer
		 * @default 16
		 */
		this.sheight = 16;
		/** The size (for reading from the image) of a single tile if this tilemap is in `"BINARY"` mode.
		 * 
		 * This should be `n` such that the width and height of the sprite is `2^n`.
		 *  If this is 4, then the sprites will be 16x16, for example.
		 * @type integer
		 * @default 4
		 */
		this.ssize = 4;
		
		/** The number of rows in this TileMap.
		 * @type integer
		 * @default 50
		 */
		this.rows = 50;
		/** The number of columns in this TileMap.
		 * @type integer
		 * @default 50
		 */
		this.cols = 50;
		
		/** The actual map to draw. Setting this will cause the map to update.
		 * 
		 * This can be set in two ways. Both ways require a string that describes the TileMap,
		 *  this can be outputted from `{@link dusk.sgui.EditableTilemap#save}`,
		 *  or as a whitespace seperated list of all the tile coordinates in order.
		 * 
		 * This can either be an object with optional properties `rows` and `cols` describing the dimensions,
		 *  and a required property `map` being the string. Or the string itself can be set directly.
		 * 
		 * @type object|string
		 */
		this.map = null;
		
		/** The path to the background image on which tiles are copied from.
		 * @type string
		 */
		this.src = "";
		/** The actual image object used to store the source image.
		 * @type HTMLImageElement
		 * @private
		 */
		this._img = null;
		
		/** An array of canvases that has the full drawn tilemap for each frame on it.
		 *  This will be copied onto the real canvas when it's time to draw it.
		 * @type array
		 * @private
		 */
		this._all = [];
		/** True if the current map has been drawn yet, else false.
		 * @type boolean
		 * @private
		 */
		this._drawn = false;
		
		/** An array of buffers used to store all the tiles.
		 * @type array
		 * @protected
		 */
		this._tileBuffer = [];
		/** An array of all the tiles that the tilemap contains per frame,
		 *  in order of where they appear on the screen (left to right, then up to down).
		 * 
		 * Each coordinate has two bytes (hence to entries in this array), `x` then `y`,
		 *  and refers to the location on the origin image for the tile.
		 * @type array
		 * @protected
		 */
		this._tiles = [];
		
		/** The time left before changing frames.
		 * @type integer
		 * @private
		 * @since 0.0.19-alpha
		 */
		this._frameRemaining = 0;
		/** The delay between each animation frame, in frames.
		 * @type integer
		 * @private
		 * @since 0.0.19-alpha
		 */
		this._frameDelay = 5;
		/** The current frame the animation is on.
		 * @type integer
		 * @private
		 * @since 0.0.19-alpha
		 */
		this._currentFrame = 0;
		/** The total number of frames needed.
		 * @type integer
		 * @private
		 * @since 0.0.19-alpha
		 */
		this._frames = 0;
		/** Whether the tilemap is animating or not.
		 * @type boolean
		 * @default true
		 * @since 0.0.19-alpha
		 */
		this.animating = true;
		
		//Prop masks
		this._registerPropMask("map", "map", true, 
			["src", "mode", "ssize", "swidth", "sheight", "tsize", "theight", "twidth", "tsize"]
		);
		this._registerPropMask("src", "src");
		this._registerPropMask("rows", "rows");
		this._registerPropMask("cols", "cols");
		this._registerPropMask("mode", "mode");
		this._registerPropMask("animated", "animated");
		
		this._registerPropMask("ssize", "ssize");
		this._registerPropMask("sheight", "sheight");
		this._registerPropMask("swidth", "swidth");
		
		this._registerPropMask("tsize", "tsize");
		this._registerPropMask("theight", "theight");
		this._registerPropMask("twidth", "twidth");
		
		//Listeners
		this.prepareDraw.listen(this._tileMapDraw, this);
		this.frame.listen(this._tileMapFrame, this);
		
		//Render support
		this.renderSupport |= dusk.sgui.Component.REND_OFFSET | dusk.sgui.Component.REND_SLICE;
	}
};
dusk.sgui.TileMap.prototype = Object.create(dusk.sgui.Component.prototype);

dusk.sgui.TileMap.prototype.className = "TileMap";

//map
Object.defineProperty(dusk.sgui.TileMap.prototype, "map", {
	set: function(value) {
		if(!value) return;
		if(typeof value == "string") value = {"map":value};
		var map = value;
		
		//Get stuff
		if(!("rows" in map)) map.rows = this.rows;
		if(!("cols" in map)) map.cols = this.cols;
		
		if("src" in map) {
			this._img = dusk.data.grabImage(map.src);
			this.src = map.src;
		}else{
			this._img = dusk.data.grabImage(this.src);
		}
		
		if("ani" in map) {
			for(var i = map.ani.length-1; i >= 0; i --) {
				dusk.sgui.TileMap.setAnimation(this.src, map.ani[i]);
			}
		}
		
		this._frames = this._framesNeeded();
		
		var singleW = 0;
		var singleH = 0;
		if(this.mode == "BINARY"){
			singleW = 1<<this.tsize;
			singleH = 1<<this.tsize;
		}else{
			singleW = this.twidth;
			singleH = this.theight;
		}
		
		var t = performance.now();
		
		this._tileBuffer = [];
		this._tiles = [];
		this._all = [];
		
		var buffer = dusk.utils.stringToData(map.map);
		this._tileBuffer[0] = buffer;
		this._tiles[0] = new Uint8Array(this._tileBuffer[0]);
		this._all[0] = dusk.utils.createCanvas((this.cols*singleW)+this.width, (this.rows*singleH)+this.height);
		
		if(this._frames > 1) {
			for(var i = 1; i < this._frames; i ++) {
				this._tileBuffer[i] = buffer.slice(0);
				this._tiles[i] = new Uint8Array(this._tileBuffer[i]);
				this._all[i] = dusk.utils.createCanvas((this.cols*singleW)+this.width, (this.rows*singleH)+this.height);
			}
		}
		
		this.rows = map.rows;
		this.cols = map.cols;
		
		
		this.drawAll();
		console.log("Map took "+(performance.now()-t)+"ms to render!");
	},
	
	get: function(){
		var hold = {};
		hold.rows = this.rows;
		hold.cols = this.cols;
		hold.src = this.src;
		hold.ani = [];
		
		var ani = dusk.sgui.TileMap.getAllAnimation(this.src);
		for(var p in ani) {
			hold.ani[hold.ani.length] = ani[p];
		}
		
		//Use new style
		//hold.map = "";
		//for(var i = 0; i < this._tiles.length; i ++){
		//	hold.map += this._tiles[i]+(i+1< this._tiles.length?(i%2?" ":","):"");
		//}
		hold.map = dusk.utils.dataToString(this._tileBuffer, dusk.utils.SD_BC16);
		
		return hold;
	}
});

/** Causes the map to update it's display. 
 * 
 * This will be called automatically before the map is drawn, but you can call it here first if you want.
 * 
 * @return {boolean} Whether it was successfull. This can fail if the origin image is not downloaded yet.
 */
dusk.sgui.TileMap.prototype.drawAll = function() {
	this._drawn = false;
	
	if(!this._img.complete) return false;
	
	this._frames = this._framesNeeded();
	this._currentFrame = 0;
	this._framesRemaining = this._frameDelay;
	
	for(var f = 0; f < this._frames; f ++) {
		this._editAnimation(this._tiles[0], this._tiles[f], f);
		
		if(this.mode == "BINARY") {
			var i = 0;
			this._all[f].getContext("2d").clearRect(0, 0, this._all[f].width, this._all[f].height);
			for (var yi = 0; yi < this.rows; yi++) {
				for (var xi = 0; xi < this.cols; xi++) {
					if(this._tiles[f][i] !== undefined) {
						this._all[f].getContext("2d").drawImage(this._img,
							this._tiles[f][i]<<this.ssize, this._tiles[f][i+1]<<this.ssize,
							1<<this.ssize, 1<<this.ssize, xi<<this.ssize, yi<<this.ssize, 1<<this.ssize, 1<<this.ssize
						);
					}
					i+=2;
				}
			}
		}else{
			var i = 0;
			this._all[f].getContext("2d").clearRect(0, 0, this._all.width, this._all.height);
			for (var yi = 0; yi < this.rows; yi++) {
				for (var xi = 0; xi < this.cols; xi++) {
					if(this._tiles[f][i] !== undefined) {
						this._all.getContext("2d").drawImage(this._img, 
							this._tiles[f][i]*this.swidth, this._tiles[f][i+1]*this.sheight, this.swidth, this.sheight, 
							xi*this.swidth, yi*this.sheight, this.swidth, this.sheight
						);
					}
					i+=2;
				}
			}
		}
	}
	
	this._drawn = true;
	return true;
};

/** Given the first frame in the tilemap, will update `arr` such that it is `offset` frames array.
 * @param {Uint8Array} origin The first frame.
 * @param {Uint8Array} orr The destination array.
 * @param {integer} offset The frame to set.
 * @private
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap.prototype._editAnimation = function(origin, arr, offset) {
	var ani = dusk.sgui.TileMap.getAllAnimation(this.src);
	var hold = [];
	
	for(var i = arr.length-2; i >= 0; i -= 2) {
		for(var p in ani) {
			if(p == origin[i]+","+origin[i+1]) {
				hold = ani[p][offset].split(",");
				arr[i] = +hold[0];
				arr[i + 1] = +hold[1];
			}
		}
	}
};

/** Returns the location of the source tile on the origin image
 *  (as in, the one that was drawn to here) that the specified coordinate is in.
 * @param {integer} x The x coordinate to look in.
 * @param {integer} y The y coordinate to look in.
 * @param {boolean=false} exactX If true
 *  then the specified x coordinate must exactly match the x coordinate of a tile on this map.
 * @param {boolean=false} exactY If true
 *  then the specified y coordinate must exactly match the y coordinate of a tile on this map.
 * @return {?array} An `[x,y]` array specifying the tile that is here, or `null`, if there is no tile here.
 */
dusk.sgui.TileMap.prototype.tilePointIn = function(x, y, exactX, exactY) {
	var xpt = 0;
	var ypt = 0;
	if(this.mode == "BINARY") {
		xpt = x/(1<<this.tsize);
		ypt = y/(1<<this.tsize);
	}else{
		xpt = x/this.twidth;
		ypt = y/this.theight;
	}
	
	if(exactX && exactY){
		return this.getTile(xpt, ypt);
	}else if(exactX){
		return this.getTile(xpt, Math.floor(ypt));
	}else if(exactY){
		return this.getTile(Math.floor(xpt), ypt);
	}else{
		return this.getTile(Math.floor(xpt), Math.floor(ypt));
	}
};

/** Used internally to manage frames.
 * @param {object} e A `frame` event object.
 * @private
 */
dusk.sgui.TileMap.prototype._tileMapFrame = function(e) {
	if(this.animating && (!("editor" in dusk) || !dusk.editor.active)) {
		if(--this._framesRemaining == 0) {
			this._framesRemaining = this._frameDelay;
			this._currentFrame = (this._currentFrame + 1) % this._frames;
		}
	}else{
		this._currentFrame = 0;
	}
};

/** Used internally to draw the tilemap.
 * @param {object} e A `prepareDraw` event object.
 * @private
 */
dusk.sgui.TileMap.prototype._tileMapDraw = function(e) {
	if(!this._img) return;
	if(!this._drawn) this.drawAll();
	if(this.mode == "BINARY") {
		var scale = this.tsize-this.ssize;
		e.c.drawImage(this._all[this._currentFrame], e.d.sourceX>>scale, e.d.sourceY>>scale, e.d.width>>scale, e.d.height>>scale,
			e.d.destX, e.d.destY, e.d.width, e.d.height
		);
	}else{
		var hscale = this.swidth/this.twidth;
		var vscale = this.sheight/this.theight;
		e.c.drawImage(this._all[this._currentFrame], e.d.sourceX*hscale, e.d.sourceY*vscale, e.d.width*hscale, e.d.height*vscale, 
			e.d.destX, e.d.destY, e.d.width, e.d.height
		);
	}
};

/** Returns the tile drawn at the specified coordinates.
 * @param {integer} x The x coordinate.
 * @param {integer} y The y coordinate.
 * @return {array} An `[x,y]` style array of the tile at this location.
 */
dusk.sgui.TileMap.prototype.getTile = function(x, y) {
	if(this._tiles[0][((y*this.cols)+x)<<1] !== undefined) {
		return [this._tiles[0][((y*this.cols)+x)<<1], this._tiles[0][(((y*this.cols)+x)<<1)+1]];
	}
	
	console.warn("Tile "+x+","+y+" not found on "+this.comName+".");
	return [0, 0];
};

/** Sets the tile to be drawn at a specified location.
 * @param {integer} x The x coordinate of the tile to change.
 * @param {integer} y The y coordinate of the tile to change.
 * @param {integer} tx The x coordinate to change the tile to.
 * @param {integer} ty The y coordinate to change the tile to.
 * @param {boolean} update If true,
 *  then the map will be redrawn and updated when the new tile is set (an expensive operation).
 *  If this is not true, then the changes won't take effect until the map is redrawn.
 */
dusk.sgui.TileMap.prototype.setTile = function(x, y, tx, ty, update) {
	if(this._tiles[0][((y*this.cols)+x)<<1] !== undefined) {
		this._tiles[0][((y*this.cols)+x)<<1] = tx;
		this._tiles[0][(((y*this.cols)+x)<<1)+1] = ty;
		if(update) this.drawAll();
	}else{
		console.warn("Tile "+x+","+y+" not found on "+this.comName+".");
	}
};

/* I have no idea what this function does, I think it doesn't work anyway.
dusk.sgui.TileMap.prototype.getRelativeTile = function(xcoord, ycoord) {
	if(this.mode == "BINARY") {
		return this.getTile((xcoord+this.lbound >> this.tsize), (ycoord+this.ubound >> this.tsize));
	}
	return this.getTile((xcoord+this.lbound * this.twidth), (ycoord+this.ubound * this.theight));
};

dusk.sgui.TileMap.prototype.inRelativeRange = function(xcoord, ycoord) {
	if(this.mode == "BINARY") {
		if(xcoord+(this.lbound>>this.tsize) < 0 || xcoord+(this.lbound>>this.tsize) >= this.cols
		|| ycoord+(this.ubound>>this.tsize) < 0 || ycoord+(this.ubound>>this.tsize) >= this.rows) return false;
	}else{
		if(xcoord+(this.lbound*this.twidth) < 0 || xcoord+(this.lbound*this.twidth) >= this.cols
		|| ycoord+(this.ubound*this.theight) < 0 || ycoord+(this.ubound*this.theight) >= this.rows) return false;
	}
	return true;
};*/

/** Returns the width of a single tile.
 * @return {integer} The width of a tile.
 */
dusk.sgui.TileMap.prototype.tileWidth = function() {
	return this.mode == "BINARY"?1 << this.tsize:this.twidth;
};

/** Returns the height of a single tile.
 * @return {integer} The height of a tile.
 */
dusk.sgui.TileMap.prototype.tileHeight = function() {
	return this.mode == "BINARY"?1 << this.tsize:this.theight;
};

/** Returns the number of visible columns.
 * @return {integer} The number of visible columns.
 */
dusk.sgui.TileMap.prototype.visibleCols = function() {
	return Math.floor(this.width/this.tileWidth());
};

/** Returns the number of visible rows.
 * @return {integer} The number of visible columns.
 */
dusk.sgui.TileMap.prototype.visibleRows = function() {
	return Math.floor(this.height/this.tileHeight());
};

/** Looks for a specified tile (from the origin image), and then returns the coordinates of where it is on this tilemap.
 * @param {integer} x The x of the tile origin we are looking for.
 * @param {integer} y The y of the tile origin we are looking for.
 * @return {?array} The location of a tile that contains the specified image,
 *  in `[x,y]` format, or null if none were found.
 */
dusk.sgui.TileMap.prototype.lookTile = function(x, y) {
	for(var t = (this.rows*this.cols)<<1; t > 0; t-=2){
		if(this._tiles[0][t] == x && this._tiles[0][t+1] == y) {
			return [(t >> 1) % this.cols, Math.floor((t >> 1)/this.cols)];
		}
	}
	
	return null;
};

//width
Object.defineProperty(dusk.sgui.TileMap.prototype, "width", {
	get: function() {
		if(this.mode == "BINARY") return this.cols<<this.tsize;
		return this.cols*this.twidth;
	},

	set: function(value) {if(value > 0) console.warn("TileMap setting width is not supported.");}
});

//height
Object.defineProperty(dusk.sgui.TileMap.prototype, "height", {
	get: function() {
		if(this.mode == "BINARY") return this.rows<<this.tsize;
		return this.rows*this.theight;
	},

	set: function(value) {if(value > 0) console.warn("TileMap setting height is not supported.");}
});

/** Internal storage for the animation data.
 * 
 * Keys are tilesheet paths and the value is another object. In the second object, the keys are the first frame of the
 *  animation, and their value is the whole animation.
 * @type object
 * @private
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap._animationData = {};

/** Sets an animation on the specified sheet, animating all tiles that match the first element of the animation array.
 * 
 * @param {string} sheet The path of the sheet to animate with. Must be exactly the same as the src used to specify the 
 *  tiles on the TileMap.
 * @param {array} animation An array of tile strings (`"0,0"` for example) that describe the animation. The first
 *  element must be the tile set on the map data.
 * @static
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap.setAnimation = function(sheet, animation) {
	if(!(sheet in dusk.sgui.TileMap._animationData)) {
		dusk.sgui.TileMap._animationData[sheet] = {};
	}
	dusk.sgui.TileMap._animationData[sheet][animation[0]] = animation;
};

/** Returns an object of all the animations registered on the specified sheet.
 * 
 * @param {string} sheet The path of the sheet to get the animations for.
 * @return {object} All the animations. The key is the first frame in the animation, while the values are the full
 *  animation. Returns an empty object if no animations have been registered for the sheet.
 * @static
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap.getAllAnimation = function(sheet) {
	if(!(sheet in dusk.sgui.TileMap._animationData)) {
		dusk.sgui.TileMap._animationData[sheet] = {};
	}
	return dusk.sgui.TileMap._animationData[sheet];
};

/** Returns the minimum number of frames needed to animate.
 * 
 * @param {?integer} test Used for recursion; the number to test to see if it works.
 * @return {integer} The lowest number of frames that the animation can use.
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap.prototype._framesNeeded = function(test) {
	if(test === undefined) test = 1;
	var ani = dusk.sgui.TileMap.getAllAnimation(this.src);
	var valid = true;
	for(var p in ani) {
		if((test % ani[p].length) != 0) {
			valid = false;
			break;
		}
	};
	
	if(valid == true) return test;
	return this._framesNeeded(test+1);
};

Object.seal(dusk.sgui.TileMap);
Object.seal(dusk.sgui.TileMap.prototype);

dusk.sgui.registerType("TileMap", dusk.sgui.TileMap);
