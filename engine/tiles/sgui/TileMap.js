//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.sgui.TileMap", (function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var editor = load.suggest("dusk.rooms.editor", function(p) {editor = p});
	var utils = load.require("dusk.utils");
	var Image = load.require("dusk.utils.Image");
	var Pool = load.require("dusk.utils.Pool");
	var TileMapWeights = load.require("dusk.tiles.sgui.TileMapWeights", function(p){TileMapWeights = p;});
	
	/** This is a grid of tiles.
	 * 
	 * It is a grid with a specified width and height for each "tile". Each of these tiles is given a location on an
	 *  image file which it then draws onto its location.
	 * 
	 * Each tile on the grid has a "tilemap coordinate", where the tile at the upper left is at (0, 0), and the next one
	 *  to the right is (1, 0) and so on. This is different from the "exact coordinate" which is the (x, y)th pixel on
	 *  the entire component. For a tilemap where each tile is 32 px wide, the exact coordinate of the tile at tilemap
	 *  coordinate (1, 0) would be (32, 0) for example.
	 * 
	 * Tilemaps have a "source image" which is where they read the images to display from. Every tile has a "source
	 *  image coordinate" which is the tilemap coordinate of the source image of the image it is displaying.
	 * 
	 * The tilemap must be drawn completley before it can be used, hence changing any tile and especially changing the
	 *  dimensions of the tilemap is a really expensive operation.
	 * 
	 * Some functions accept and return tileData objects. This is  an array, the first two elements are the x and y
	 *  source image coordinate of the tile dysplayed, the second two are the x and y tilemap coordinates of the tile,
	 *  and the last two elements are the weight of this tile and an integer which is 0 iff the tile is not solid,
	 *  otherwise it's 1.
	 * 
	 * TileMaps have the property `dusk.sgui.MouseAugment.mousePierce` set to true by default.
	 * 
	 * @extends dusk.sgui.Component
	 * @param {?dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @constructor
	 */
	var TileMap = function (parent, comName) {
		Component.call(this, parent, comName);
		
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
		
		/** The width of the tiles in the source image.
		 * @type integer
		 * @default 16
		 */
		this.swidth = 16;
		/** The height of the tiles in the source image.
		 * @type integer
		 * @default 16
		 */
		this.sheight = 16;
		
		
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
		 * This requires  a string that describes the TileMap, this can be acquired from `getMap`, or as a whitespace
		 *  seperated list of all the tile coordinates in order.
		 * 
		 * This can be an object with the following properties:
		 * - map: Required, a string that can be decoded with `utils.stringToData` which represents the map itself.
		 * - rows: Number of rows in the TileMap.
		 * - cols: Number of cols in the TileMap.
		 * - src: Set to the src image of the tilemap.
		 * - ani: An array of animations which are fed to `setAnimation`.
		 * - weights: An object from `TileMapWeights.export` to use as the tile map weights.
		 * 
		 * In addition, the `map` string can be set directly.
		 * 
		 * @type object|string
		 */
		this.map = null;
		
		/** Used internally to store the set image src.
		 * @type string
		 * @private
		 * @since 0.0.20-alpha
		 */
		this._src = "";
		/** The path to the background image on which tiles are copied from.
		 * @type string
		 */
		this.src = "";
		/** The actual image object used to store the source image.
		 * @type dusk.utils.Image
		 * @private
		 */
		this._img = null;
		
		/** An array of canvases that has the full drawn tilemap for each frame on it. This will be copied onto the real
		 *  canvas when it's time to draw it.
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
		/** An array of UintClampedArrays representing frames of tiles, tiles are arranged left to right, then up to
		 *  down.
		 * 
		 * Each tile consists of two bytes, which are their x and y source image coordinates.
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
		
		/** If set, this is the weights of a given tile. This can be changed often, and incurs no performance problems.
		 * @type ?dusk.tiles.sgui.TileMapWeights
		 * @since 0.0.21-alpha
		 */
		this.weights = null;
		
		//Prop masks
		this._registerPropMask("map", "map", true, 
			["src", "swidth", "sheight", "theight", "twidth", "tsize"]
		);
		this._registerPropMask("src", "src");
		this._registerPropMask("rows", "rows");
		this._registerPropMask("cols", "cols");
		this._registerPropMask("animated", "animated");
		
		this._registerPropMask("sheight", "sheight");
		this._registerPropMask("swidth", "swidth");
		
		this._registerPropMask("theight", "theight");
		this._registerPropMask("twidth", "twidth");
		
		//Listeners
		this.prepareDraw.listen(_draw.bind(this));
		this.frame.listen(_frame.bind(this));
		
		//Default values
		this.augment.listen((function(e) {
			this.mouse.clickPierce = true;
		}).bind(this), "mouse");
	};
	TileMap.prototype = Object.create(Component.prototype);
	
	//map
	Object.defineProperty(TileMap.prototype, "map", {
		set: function(value) {
			if(!value) return;
			if(typeof value == "string") value = {"map":value};
			var map = value;
			
			//Set width and height
			if(!("rows" in map)) map.rows = this.rows;
			if(!("cols" in map)) map.cols = this.cols;
			
			// Set src, if it exists
			if("src" in map) {
				this.src = map.src;
			}
			
			// And animation
			if("ani" in map) {
				for(var i = map.ani.length-1; i >= 0; i --) {
					TileMap.setAnimation(this.src, map.ani[i]);
				}
			}
			
			// Count the number of frames needed
			this._frames = this._framesNeeded();
			
			var singleW = this.twidth;
			var singleH = this.theight;
			
			// Time performance
			if("performance" in window && "now" in window.performance) var t = performance.now();
			
			// Reset all the things
			this._tileBuffer = [];
			this._tiles = [];
			this._all = [];
			
			// Create the first frame
			var buffer = utils.stringToData(map.map);
			this._tileBuffer[0] = buffer;
			this._tiles[0] = new Uint8ClampedArray(this._tileBuffer[0]);
			this._all[0] = utils.createCanvas((map.cols*singleW)+this.width, (map.rows*singleH)+this.height);
			
			// And then loop and create the other frames
			if(this._frames > 1) {
				for(var i = 1; i < this._frames; i ++) {
					this._tileBuffer[i] = buffer.slice(0);
					this._tiles[i] = new Uint8ClampedArray(this._tileBuffer[i]);
					this._all[i] = utils.createCanvas((this.cols*singleW)+this.width, (this.rows*singleH)+this.height);
				}
			}
			
			// Set the rows and columns
			this.rows = map.rows;
			this.cols = map.cols;
			
			// Get the weights
			if("weights" in map && map.weights) {
				this._img.loadPromise().then((function(value) {
					this.weights = new TileMapWeights(this._img.height()/singleH, this._img.width()/singleW);
					this.weights.import(map.weights);
				}).bind(this));
				this.weights = new TileMapWeights(0, 0);
			}
			
			// Draw it
			this.drawAll();
			
			// Output performance
			if(t) console.log("Map took "+(performance.now()-t)+"ms to render!");
		},
		
		get: function(){
			var hold = {};
			hold.rows = this.rows;
			hold.cols = this.cols;
			hold.src = this.src;
			hold.ani = [];
			
			var ani = TileMap.getAllAnimation(this.src);
			for(var p in ani) {
				hold.ani[hold.ani.length] = ani[p];
			}
			
			hold.map = utils.dataToString(this._tileBuffer[0], utils.SD_BC16);
			hold.weights = this.weights ? this.weights.export() : "";
			
			return hold;
		}
	});
	
	//src
	Object.defineProperty(TileMap.prototype, "src", {
		get: function() {return this._src;},
		
		set: function(value) {
			if(value) {
				this._img = new Image(value);
				this._src = value;
			}else{
				this._img = null;
				this._src = "";
			}
		}
	});
	
	/** Causes the map to update its display. 
	 * 
	 * This will be called automatically before the map is drawn, but you can call it here first if you want.
	 * 
	 * @return {boolean} Whether it was successfull. This can fail if the origin image is not downloaded yet.
	 */
	TileMap.prototype.drawAll = function() {
		this._drawn = false;
		
		if(!this._img || !this._img.isReady()) return false;
		
		this._frames = this._framesNeeded();
		this._currentFrame = 0;
		this._framesRemaining = this._frameDelay;
		
		for(var f = 0; f < this._frames; f ++) {
			this._editAnimation(this._tiles[0], f);
			var i = 0;
			this._all[f].getContext("2d").clearRect(0, 0, this._all[f].width, this._all[f].height);
			for (var yi = 0; yi < this.rows; yi++) {
				for (var xi = 0; xi < this.cols; xi++) {
					this._img.paint(this._all[f].getContext("2d"), "", false,
						this._tiles[f][i]*this.swidth, this._tiles[f][i+1]*this.sheight, this.swidth, this.sheight, 
						xi*this.swidth, yi*this.sheight, this.swidth, this.sheight
					);
					i+=2;
				}
			}
		}
		
		this._drawn = true;
		return true;
	};
	
	/** Given the first frame in the tilemap, will update the tiles on the tilemap to create the frame `offset` frames
	 *  later.
	 * 
	 * If the arrays are not the same size, then the destination array will be recreated at that size.
	 * @param {Uint8Array} origin The first frame.
	 * @param {integer} offset The frame to set.
	 * @private
	 * @since 0.0.19-alpha
	 */
	TileMap.prototype._editAnimation = function(origin, offset) {
		var ani = TileMap.getAllAnimation(this.src);
		var hold = [];
		var changed = false;
		
		if(offset >= this._tiles.length || origin.length != this._tiles[offset].length) {
			this._tileBuffer[offset] = origin.buffer.slice(0);
			this._tiles[offset] = new Uint8Array(this._tileBuffer[offset]);
			this._all[offset] = 
				utils.createCanvas((this.cols*this.swidth)+this.width, (this.rows*this.sheight)+this.height);
		}
		
		for(var i = origin.length-2; i >= 0; i -= 2) {
			changed = false;
			for(var p in ani) {
				if(p == origin[i]+","+origin[i+1]) {
					hold = ani[p][offset % ani[p].length].split(",");
					this._tiles[offset][i] = +hold[0];
					this._tiles[offset][i + 1] = +hold[1];
					changed = true;
				}
			}
			if(!changed) {
				this._tiles[offset][i] = origin[i];
				this._tiles[offset][i+1] = origin[i+1];
			}
		}
	};
	
	/** Returns the tile data of the tile that the specified coordinate is in.
	 * 
	 * Please return the output to `tileData` when you are done.
	 * @param {integer} x The x exact coordinate to look in.
	 * @param {integer} y The y exact coordinate to look in.
	 * @param {boolean=false} exactX If true
	 *  then the specified x coordinate must exactly match the x coordinate of a tile on this map.
	 * @param {boolean=false} exactY If true
	 *  then the specified y coordinate must exactly match the y coordinate of a tile on this map.
	 * @return {?array} A tileData object describing the tile, or `null`, if there is no tile here.
	 */
	TileMap.prototype.tilePointIn = function(x, y, exactX, exactY) {
		var xpt = x/this.twidth;
		var ypt = y/this.theight;
		
		if(exactX && exactY){
			return this.getTile(xpt, ypt);
		}else if(exactX){
			return this.getTile(xpt, ~~ypt);
		}else if(exactY){
			return this.getTile(~~xpt, ypt);
		}else{
			return this.getTile(~~xpt, ~~ypt);
		}
	};

	/** Assumes this TileMap is a schematic, and returns whether the specified coordinates are in a solid place.
	 * 
	 * If they are in a solid place, it returns the number of pixels to add to the x or y coordinate such that there is
	 *  no collision.
	 * 
	 * This TileMap must have a `weights` value to use make use of this.
	 * 
	 * @param {integer} x The x exact coordinate to check.
	 * @param {integer} y The y exact coordinate to check.
	 * @param {boolean=false} shiftRight If true, then the entitiy will be shifted right/down, else left/up.
	 * @param {boolean=false} shiftVer If true, then this will return the shift for vertical, rather than horizontal.
	 * @return {integer} The number of pixels to shift this. This will be negative for left or up shifts.
	 * @since 0.0.20-alpha
	 */
	TileMap.prototype.mapSolidIn = function(x, y, shiftRightDown, shiftVer) {
		if(!this.weights) {
			return 0;
		}
		
		var tileNow = this.tilePointIn(x, y);
		var toRet = 0;
		
		if(this.weights.getSolid(tileNow[0], tileNow[1])) {
			if(!shiftRightDown && !shiftVer)
				toRet = -(x % this.tileWidth());
			if(shiftRightDown && !shiftVer)
				toRet = -(x % this.tileWidth()) + this.tileWidth();
			if(!shiftRightDown && shiftVer)
				toRet = -(y % this.tileHeight());
			if(shiftRightDown && shiftVer)
				toRet = -(y % this.tileHeight()) + this.tileHeight();
		}
		
		TileMap.tileData.free(tileNow);
		
		return toRet;
	};
	
	/** Used internally to manage frames.
	 * @param {object} e A `frame` event object.
	 * @private
	 */
	var _frame = function(e) {
		if(this.animating && (!editor || !editor.active)) {
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
	var _draw = function(e) {
		if(!this._img) return;
		if(!this._drawn) this.drawAll();
		
		var hscale = this.swidth/this.twidth;
		var vscale = this.sheight/this.theight;
		e.c.drawImage(this._all[this._currentFrame],
			e.d.sourceX*hscale, e.d.sourceY*vscale, e.d.width*hscale, e.d.height*vscale, 
			e.d.destX, e.d.destY, e.d.width, e.d.height
		);
	};
	
	/** Returns the tile data of the tile at the specified tilemap coordinates.
	 * 
	 * Please return the output to `tileData` when you are done.
	 * @param {integer} x The x coordinate.
	 * @param {integer} y The y coordinate.
	 * @return {array} Tiledata of the specified tile.
	 */
	TileMap.prototype.getTile = function(x, y) {
		var t = TileMap.tileData.alloc();
		t[2] = x;
		t[3] = y;
		
		if(this._tiles[0][((y*this.cols)+x)<<1] !== undefined) {
			t[0] = this._tiles[0][((y*this.cols)+x)<<1];
			t[1] = this._tiles[0][(((y*this.cols)+x)<<1)+1];
			
			if(this.weights) {
				t[4] = this.weights.getWeight(t[0], t[1]);
				t[5] = this.weights.getSolid(t[0], t[1])?1:0;
			}else{
				t[4] = 1;
				t[5] = 0;
			}
		}
		
		//console.warn("Tile "+x+","+y+" not found on "+this.comName+".");
		
		return t;
	};
	
	/** Given a tileData and a `dusk.sgui.c.DIR_*` direction, updates the tile data such that it refers to an adjacent
	 *  tile.
	 * 
	 * Please return the output to `tileData` when you are done.
	 * @param {Array} t The tile to shift.
	 * @param {integer} dir The direction to shift, one of the `dusk.sgui.c.DIR_*` constants.
	 * @return {array} A tiledata array of the tile at this location.
	 */
	TileMap.prototype.shiftTile = function(t, dir) {
		if(dir == c.DIR_UP) {
			t[3] --;
			t[0] = this._tiles[0][((t[3]*this.cols)+t[2])<<1];
			t[1] = this._tiles[0][(((t[3]*this.cols)+t[2])<<1)+1];
		}else if(dir == c.DIR_DOWN) {
			t[3] ++;
			t[0] = this._tiles[0][((t[3]*this.cols)+t[2])<<1];
			t[1] = this._tiles[0][(((t[3]*this.cols)+t[2])<<1)+1];
		}else if(dir == c.DIR_LEFT) {
			t[2] --;
			t[0] = this._tiles[0][((t[3]*this.cols)+t[2])<<1];
			t[1] = this._tiles[0][(((t[3]*this.cols)+t[2])<<1)+1];
		}else if(dir == c.DIR_RIGHT) {
			t[2] ++;
			t[0] = this._tiles[0][((t[3]*this.cols)+t[2])<<1];
			t[1] = this._tiles[0][(((t[3]*this.cols)+t[2])<<1)+1];
		}
		
		if(this.weights) {
			t[4] = this.weights.getWeight(t[0], t[1]);
			t[5] = this.weights.getSolid(t[0], t[1])?1:0;
		}else{
			t[4] = 1;
			t[5] = 0;
		}
		
		return t;
	};
	
	/** Sets the tile to be drawn at a specified location.
	 * @param {integer} x The x tilemap coordinate of the tile to change.
	 * @param {integer} y The y tilemap coordinate of the tile to change.
	 * @param {integer} tx The x source image coordinate to change the tile to.
	 * @param {integer} ty The y source image coordinate to change the tile to.
	 * @param {boolean} update If true, then the map will be redrawn and updated when the new tile is set (an expensive
	 *  operation). If this is not true, then the changes won't take effect until the map is redrawn.
	 */
	TileMap.prototype.setTile = function(x, y, tx, ty, update) {
		if(x > this.cols || y > this.rows || x < 0 || y < 0) return;
		
		if(this._tiles[0][((y*this.cols)+x)<<1] !== undefined) {
			this._tiles[0][((y*this.cols)+x)<<1] = tx;
			this._tiles[0][(((y*this.cols)+x)<<1)+1] = ty;
			if(update) this.drawAll();
		}else{
			//console.warn("Tile "+x+","+y+" not found on "+this.comName+".");
		}
	};
	
	/** Returns the width of a single tile.
	 * @return {integer} The width of a tile.
	 */
	TileMap.prototype.tileWidth = function() {
		return this.twidth;
	};
	
	/** Returns the height of a single tile.
	 * @return {integer} The height of a tile.
	 */
	TileMap.prototype.tileHeight = function() {
		return this.theight;
	};
	
	/** Returns the number of visible columns.
	 * @return {integer} The number of visible columns.
	 */
	TileMap.prototype.visibleCols = function() {
		return Math.floor(this.width/this.tileWidth());
	};
	
	/** Returns the number of visible rows.
	 * @return {integer} The number of visible columns.
	 */
	TileMap.prototype.visibleRows = function() {
		return Math.floor(this.height/this.tileHeight());
	};
	
	/** Looks for a specified tile given source coordinates, and then returns the tilemap coordinates of a tile that has
	 *  them.
	 * @param {integer} x The x source coordinate.
	 * @param {integer} y The y source coordinate.
	 * @return {?array} The location of a tile that contains the specified image, in `[x,y]` format, or null if none
	 *  were found.
	 */
	TileMap.prototype.lookTile = function(x, y) {
		for(var t = (this.rows*this.cols)<<1; t > 0; t-=2){
			if(this._tiles[0][t] == x && this._tiles[0][t+1] == y) {
				return [(t >> 1) % this.cols, Math.floor((t >> 1)/this.cols)];
			}
		}
		
		return null;
	};
	
	//width
	Object.defineProperty(TileMap.prototype, "width", {
		get: function() {
			return this.cols*this.twidth;
		},

		set: function(value) {if(value > 0) console.warn("TileMap setting width is not supported.");}
	});
	
	//height
	Object.defineProperty(TileMap.prototype, "height", {
		get: function() {
			return this.rows*this.theight;
		},

		set: function(value) {if(value > 0) console.warn("TileMap setting height is not supported.");}
	});
	
	/** Internal storage for the animation data.
	 * 
	 * Keys are tilesheet paths and the value is another object. In the second object, the keys are the first frame of
	 *  the animation, and their value is the whole animation.
	 * @type object
	 * @private
	 * @since 0.0.19-alpha
	 */
	var _animationData = {};
	
	/** Sets an animation on the specified sheet, animating all tiles that match the first element of the animation
	 *  array.
	 * 
	 * @param {string} sheet The path of the sheet to animate with. Must be exactly the same as the src used to specify
	 *  the  tiles on the TileMap.
	 * @param {array} animation An array of tile strings (`"0,0"` for example) that describe the animation. The first
	 *  element must be the tile set on the map data.
	 * @static
	 * @since 0.0.19-alpha
	 */
	TileMap.setAnimation = function(sheet, animation) {
		if(!(sheet in _animationData)) {
			_animationData[sheet] = {};
		}
		_animationData[sheet][animation[0]] = animation;
		
		if(!animation || animation.length < 2) {
			delete _animationData[sheet][animation[0]];
		}
	};
	
	/** Gets an animation on the specified sheet.
	 * 
	 * @param {string} sheet The path of the sheet to animate with. Must be exactly the same as the src used to specify
	 *  the tiles on the TileMap.
	 * @param {array} base The first tile of the animation as a TileMapData object or a "x,y" style string.
	 * @return {array} The animation, as an array of tiles to set. If no animation is set, this will have a length of
	 *  one.
	 * @static
	 * @since 0.0.20-alpha
	 */
	TileMap.getAnimation = function(sheet, base) {
		if(Array.isArray(base) || base instanceof Uint8Array || base instanceof Uint8ClampedArray) {
			base = base[0]+","+base[1];
		}
		
		if(!(sheet in _animationData)) {
			return [base];
		}
		
		if(_animationData[sheet][base]) {
			return _animationData[sheet][base];
		}
		
		return [base];
	};
	
	/** Returns an object of all the animations registered on the specified sheet.
	 * 
	 * @param {string} sheet The path of the sheet to get the animations for.
	 * @return {object} All the animations. The key is the first frame in the animation, while the values are the full
	 *  animation. Returns an empty object if no animations have been registered for the sheet.
	 * @static
	 * @since 0.0.19-alpha
	 */
	TileMap.getAllAnimation = function(sheet) {
		if(!(sheet in _animationData)) {
			_animationData[sheet] = {};
		}
		return _animationData[sheet];
	};
	
	/** Returns the minimum number of frames needed to animate.
	 * 
	 * @param {?integer} test Used for recursion; the number to test to see if it works.
	 * @return {integer} The lowest number of frames that the animation can use.
	 * @since 0.0.19-alpha
	 */
	TileMap.prototype._framesNeeded = function(test) {
		if(test === undefined) test = 1;
		var ani = TileMap.getAllAnimation(this.src);
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
	
	
	
	/** Returns the map for `{@link dusk.rooms.sgui.LayeredRoom}` to save it.
	 * 
	 * @return {object} The current map.
	 * @since 0.0.18-alpha
	 */
	TileMap.prototype.saveBM = function() {
		return this.map;
	};
	
	/** Loads a map from an object. This is used by `dusk.rooms.sgui.LayeredRoom`.
	 * 
	 * @param {object} map The map to load, will be assigned to `map`.
	 * @since 0.0.18-alpha
	 */
	TileMap.prototype.loadBM = function(map) {
		this.map = map;
	};
	
	/** Returns a string representing the map in this tilemap.
	 * 
	 * This can be used with `map` to create this map (although just reading the `map` property is prefered).
	 * @return {string} A string representation of the map.
	 */
	TileMap.prototype.getMap = function() {
		return this.map.map;
	};
	
	/** A pool containing the values returned by `getTile` please return them here when you are done.
	 * 
	 * Tile data is an array in the form `[value x, value y, tile x, tile y, weight]`.
	 * 
	 * @type dusk.pool(Array)
	 * @since 0.0.21-alpha
	 */
	TileMap.tileData = new Pool(Uint8Array.bind(undefined, 5));
	
	sgui.registerType("TileMap", TileMap);
	
	return TileMap;
})());


load.provide("dusk.tiles.sgui.TileMapWeights", (function() {
	var utils = load.require("dusk.utils");
	
	/** Stores weights of tilemap schematic layers.
	 * 
	 * Essentially, it maps a given tile on the schematic layer to a weight.
	 * 
	 * Tiles not set have a weight of 1. Tiles cannot have a weight of less than 1 or larger than 127.
	 * 
	 * Tiles can also be either solid or not solid.
	 * 
	 * @param {integer} rows The number of rows in the source image.
	 * @param {integer} cols The number of columns in the source image.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var TileMapWeights = function(rows, cols) {
		this.rows = rows;
		this.cols = cols;
		
		this._weights = new Uint8Array(this.rows * this.cols);
	};

	/** Sets the weight of a given tile.
	 * @param {integer} x The x coordinate of the tile on the tilesheet.
	 * @param {integer} y The y coordinate of the tile on the tilesheet.
	 * @param {integer} w The weight to set the tile.
	 */
	TileMapWeights.prototype.addWeight = function(x, y, w) {
		this._weights[(y * this.cols) + x] = w | (this._weights[(y * this.cols) + x] & 0x80);
	};

	/** Gets the weight of a given tile.
	 * @param {integer} x The x coordinate of the tile on the tilesheet.
	 * @param {integer} y The y coordinate of the tile on the tilesheet.
	 * @return {integer} The weight of the given tile.
	 */
	TileMapWeights.prototype.getWeight = function(x, y) {
		if(!(this._weights[(y * this.cols) + x] & 0x7f)) return 1;
		return this._weights[(y * this.cols) + x] & 0x7f;
	};

	/** Sets whether the tile is solid or not.
	 * @param {integer} x The x coordinate of the tile on the tilesheet.
	 * @param {integer} y The y coordinate of the tile on the tilesheet.
	 * @param {boolean} solid Whether to set the tile as solid or not.
	 */
	TileMapWeights.prototype.addSolid = function(x, y, solid) {
		this._weights[(y * this.cols) + x] = (solid?0x80:0x00) | (this._weights[(y * this.cols) + x] & 0x7f);
	};

	/** Sets whether the tile is solid or not.
	 * @param {integer} x The x coordinate of the tile on the tilesheet.
	 * @param {integer} y The y coordinate of the tile on the tilesheet.
	 * @return {boolean} Whether the given tile is solid or not.
	 */
	TileMapWeights.prototype.getSolid = function(x, y) {
		return (this._weights[(y * this.cols) + x] & 0x80) == 0x80;
	};
	
	/** Returns the weights as a string.
	 * @return {string} The weights.
	 */
	TileMapWeights.prototype.export = function() {
		return utils.dataToString(this._weights, utils.SD_HEX);
	};
	
	/** Loads weights from a string previously generated by `export`. This will replace all existing weights.
	 * @param {string} The weights to import.
	 */
	TileMapWeights.prototype.import = function(str) {
		this._weights = new Uint8Array(utils.stringToData(str));
		if(this._weights.length != this.cols * this.rows) {
			console.warn("Weights dimensions loaded do not match, removing.");
			this._weights = new Uint8Array(this.rows * this.cols);
		}
	};
	
	return TileMapWeights;
})());
