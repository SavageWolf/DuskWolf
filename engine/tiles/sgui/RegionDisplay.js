//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.sgui.RegionDisplay", (function() {
	var Component = load.require("dusk.sgui.Component");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	var Image = load.require("dusk.utils.Image");
	var Region = load.require("dusk.tiles.Region");

	/** @class dusk.tiles.sgui.RegionDisplay
	 * 
	 * @classdesc A tile region serves to group tiles, and can colour them.
	 * 
	 * Generally, a region represents a grid of identical sized tiles. Each tile can be in a number of regions, and
	 * contain basic pathing information on how to get from a "starting point". Regions can also have all the tiles in 
	 * them coloured, as well.
	 * 
	 * Tiles can be added to regions individually, but it is more usefull to use
	 *  `{@link dusk.tiles.sgui.RegionDisplay#expandRegion}` to create a region that, essentially, says "Every
	 *  tile that is n tiles away from a given tile". If you use `expandRegion`, you get paths to and from the "origin"
	 *  tile for free.
	 * 
	 * @extends dusk.sgui.Component
	 * @param {?dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var RegionDisplay = function (parent, name) {
		Component.call(this, parent, name);
		
		/** The width of a single tile.
		 * @type integer
		 * @default 32
		 */
		this.twidth = 32;
		/** The height of a single tile.
		 * @type integer
		 * @default 32
		 */
		this.theight = 32;
		
		/** The number of rows in this RegionDisplay.
		 * @type integer
		 * @default 50
		 */
		this.rows = 50;
		/** The number of columns in this RegionDisplay.
		 * @type integer
		 * @default 50
		 */
		this.cols = 50;
		
		/** The colours of regions. An array of `[region, colour]` pairs. Entries later in the array will be drawn over
		 *  the rest.
		 * @type object
		 * @private
		 */
		this._cachedTileColours = new Map();
		this._cachedArrows = new Map();
		this._needsCacheUpdating = false;
		this._paint = [];
		
		//Prop masks
		this._mapper.map("rows", "rows");
		this._mapper.map("cols", "cols");
		
		this._mapper.map("theight", "theight");
		this._mapper.map("twidth", "twidth");
		
		this._mapper.map("paint", "paint");
		
		//Listeners
		this.prepareDraw.listen(this._tileRegionDraw.bind(this));
	};
	RegionDisplay.prototype = Object.create(Component.prototype);
	
	RegionDisplay.prototype._updateTileColourCache = function() {
		this._needsCacheUpdating = true;
	};
	
	RegionDisplay.MODE_REGION = 0;
	RegionDisplay.MODE_SUBREGION = 1;
	RegionDisplay.MODE_PATH = 2;
	
	/** Used internally to draw the tilemap.
	 * @param {object} e A `prepareDraw` event object.
	 * @private
	 */
	RegionDisplay.prototype._tileRegionDraw = function(e) {
		//Update the colour cache if needed
		if(this._needsCacheUpdating) {
			this._cachedTileColours = new Map();
			
			//Loop through all regions
			for(var n of this._paint) {
				if(n[1] != RegionDisplay.MODE_PATH) {
					var tiles = null;
					if(n[1] == RegionDisplay.MODE_REGION) {
						tiles = n[4].all();
					}else if(n[1] == RegionDisplay.MODE_SUBREGION) {
						tiles = n[4].allSub(n[5]);
					}
					
					for(var t of tiles) {
						if(n[1] != RegionDisplay.MODE_REGION || t[Region.tfields.stoppable] || n[2].allowUnstoppable) {
							this._cachedTileColours.set(t[1] * this.cols + t[0], n[2]);
						}
					}
				}
			}
			
			this._needsCacheUpdating = false;
		}
		
		
		for(c of this._cachedTileColours) {
			var x = c[0] % this.cols;
			var y = ~~(c[0] / this.cols);
			
			if((x+1) * this.tileWidth() < e.d.slice.x
			|| x * this.tileWidth() > e.d.slice.x + e.d.width
			|| (y+1) * this.tileHeight() < e.d.slice.y
			|| y * this.tileHeight() > e.d.slice.y + e.d.height) {
				continue;
			}
			
			e.c.fillStyle = c[1];
			e.c.fillRect(
				e.d.dest.x + ((x * this.tileWidth()) - e.d.slice.x) + 1,
				e.d.dest.y + ((y * this.tileHeight()) - e.d.slice.y) + 1,
				this.tileWidth() - 2, this.tileHeight() - 2
			);
		}
		
		
		this._cachedArrows = new Map();
		for(var n of this._paint) {
			if(n[1] == RegionDisplay.MODE_PATH) {
				var last = undefined;
				var lastX = undefined;
				var lastY = undefined;
				n[4].forEach((function(x, y, z, enter, stop) {
					if(last !== undefined) {
						this._cachedArrows.set(lastY * this.cols + lastX, [n[2], _arrowThrough(last, enter)]);
					}
					last = enter;
					lastX = x;
					lastY = y;
				}).bind(this));
				this._cachedArrows.set(lastY * this.cols + lastX, [n[2], _arrowThrough(last, dirs.NONE)]);
			}
		}
		
		for(var a of this._cachedArrows) {
			var x = a[0] % this.cols;
			var y = ~~(a[0] / this.cols);
			
			var img = new Image(a[1][0]);
			
			if(img.isReady()) {
				var hscale = 1//this.swidth/this.width;
				var vscale = 1//this.sheight/this.height;
				img.paintScaled(e.c, [], false,
					a[1][1][0] * this.tileWidth(), a[1][1][1] * this.tileHeight(), 
					this.tileWidth()*hscale, this.tileWidth()*vscale,
					
					e.d.dest.x + ((x * this.tileWidth()) - e.d.slice.x),
					e.d.dest.y + ((y * this.tileHeight()) - e.d.slice.y),
					this.tileWidth(), this.tileHeight(),
					1, 1
				);
			}
		}
	};
	
	RegionDisplay.prototype._arrowSide = function(now, region, x, y) {
		var rel = region.getAll(x, y);
		
		if(!rel.length) return false;
		
		for(var i = 0; i < rel.length; i ++) {
			if(rel[i][6] == now[6] + 1) return true;
			if(rel[i][6] == now[6] - 1) return true;
		}
		
		return false;
	};
	
	var _arrowThrough = function(enter, exit) {
		return _getArrow(
			enter == dirs.NONE,
			enter == dirs.E || exit == dirs.W,
			enter == dirs.W || exit == dirs.E,
			enter == dirs.S || exit == dirs.N,
			enter == dirs.N || exit == dirs.S
		);
	};
	
	var _getArrow = function(init, left, right, up, down) {
		if(up && down && left && right) return [1, 0];
		if(!up && !down && !left && !right) return [0, 0];
		
		if(up && down && !left && right) return [0, 4];
		if(!up && down && left && right) return [1, 4];
		if(up && down && left && !right) return [2, 4];
		if(up && !down && left && right) return [3, 4];
		
		if(!up && down && !left && right) return [0, 3];
		if(!up && down && left && !right) return [1, 3];
		if(up && !down && left && !right) return [2, 3];
		if(up && !down && !left && right) return [3, 3];
		
		if(up && down && !left && !right) return [2, 0];
		if(!up && !down && left && right) return [3, 0];
		
		if(init) {
			if(right) return [0, 1];
			if(left) return [1, 1];
			if(up) return [2, 1];
			if(down) return [3, 1];
		}else{
			if(right) return [0, 2];
			if(left) return [1, 2];
			if(up) return [2, 2];
			if(down) return [3, 2];
		}
	};
	
	RegionDisplay.prototype.display = function(name, mode, colour, options, obj1, obj2) {
		this._paint.push([name, mode, colour, options, obj1, obj2]);
		this._updateTileColourCache();
	};
	
	RegionDisplay.prototype.undisplay = function(name) {
		for(var i = 0; i < this._paint.length; i ++) {
			if(this._paint[i][0] == name) {
				this._paint.splice(i, 1);
				break;
			}
		}
		
		this._updateTileColourCache();
	};
	
	
	/** Returns the width of a single tile.
	 * @return {integer} The width of a tile.
	 */
	RegionDisplay.prototype.tileWidth = function() {
		return this.twidth;
	};
	
	/** Returns the height of a single tile.
	 * @return {integer} The height of a tile.
	 */
	RegionDisplay.prototype.tileHeight = function() {
		return this.theight;
	};
	
	/** Returns the number of visible columns.
	 * @return {integer} The number of visible columns.
	 */
	RegionDisplay.prototype.visibleCols = function() {
		return Math.floor(this.width/this.tileWidth());
	};
	
	/** Returns the number of visible rows.
	 * @return {integer} The number of visible columns.
	 */
	RegionDisplay.prototype.visibleRows = function() {
		return Math.floor(this.height/this.tileHeight());
	};
	
	//width
	Object.defineProperty(RegionDisplay.prototype, "width", {
		get: function() {return this.cols*this.twidth;},
		set: function(value) {if(value > 0) console.warn("RegionDisplay setting width is not supported.");}
	});
	
	//height
	Object.defineProperty(RegionDisplay.prototype, "height", {
		get: function() {return this.rows*this.theight;},
		set: function(value) {if(value > 0) console.warn("RegionDisplay setting height is not supported.");}
	});
	
	/** Returns the map for `{@link dusk.rooms.sgui.LayeredRoom}` to save it.
	 * 
	 * @return {object} The current map.
	 * @since 0.0.18-alpha
	 */
	RegionDisplay.prototype.saveBM = function() {
		return {"rows":this.rows, "cols":this.cols};
	};
	
	/* Loads a map from an object. This is used by `{@link dusk.rooms.sgui.LayeredRoom}`.
	 * 
	 * @param {object} map The map to load, will be assigned to `{@link dusk.tiles.sgui.EditableTileMap#map}`.
	 * @since 0.0.18-alpha
	 */
	RegionDisplay.prototype.loadBM = function(data) {
		this.rows = data.rows;
		this.cols = data.cols;
	};
	
	sgui.registerType("RegionDisplay", RegionDisplay);
	
	return RegionDisplay;
})());