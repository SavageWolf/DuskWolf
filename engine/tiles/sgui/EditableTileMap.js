//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.sgui.EditableTileMap", function() {
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var editor = load.require("dusk.rooms.editor");
	var keyboard = load.require("dusk.input.keyboard");
	var controls = load.require("dusk.input.controls");
	
	/** Extends the regular tilemap to add the ability to edit them.
	 * 
	 * When this has focus, keyboard combinations will be recognised and can change things, and a "frame" or "cursor"
	 *  will appear, allowing you to select and change tiles.
	 * 
	 * @param {dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @extends dusk.tiles.sgui.TileMap
	 * @memberof dusk.tiles.sgui
	 */
	class EditableTileMap extends TileMap {
		/** Creates a new EditableTileMap instance.
		 *
		 * @param {dusk.sgui.Group} parent The container that this component is in.
	 	 * @param {string} componentName The name of the component.
		 */
		constructor(parent, name) {
			super(parent, name);
			
			/** If true, then this will use "global coordinates", meaning that the location of the frame will be the same
			 *  over all EditableTileMaps with this set to true.
			 * @type boolean
			 * @default false
			 * @memberof! dusk.tiles.sgui.EditableTileMap#
			 */
			this.globalCoords = false;
			/** The colour of the frame, which appears as a border.
			 * @type string
			 * @default "#000000"
			 * @memberof! dusk.tiles.sgui.EditableTileMap#
			 */
			this.cursorColour = "#000000";
			
			/** The current x of the tile the cursor is at.
			 * 
			 * This is not the x coordinate at which it is drawn, but the actual tile coordinate.
			 * @type integer
			 * @protected
			 * @memberof! dusk.tiles.sgui.EditableTileMap#
			 */
			this._cx = 0;
			/** The current y of the tile the cursor is at.
			 * 
			 * This is not the y coordinate at which it is drawn, but the actual tile coordinate.
			 * @type integer
			 * @protected
			 * @memberof! dusk.tiles.sgui.EditableTileMap#
			 */
			this._cy = 0;
			
			/** The height of the frame, in tiles.
			 * 
			 * Whenever a change is made, all the tiles in the frame will be set the same value.
			 * @type integer
			 * @default 1
			 * @memberof! dusk.tiles.sgui.EditableTileMap#
			 */
			this.frameHeight = 1;
			/** The width of the frame, in tiles.
			 * 
			 * Whenever a change is made, all the tiles in the frame will be set the same value.
			 * @type integer
			 * @default 1
			 * @memberof! dusk.tiles.sgui.EditableTileMap#
			 */
			this.frameWidth = 1;
			/** The current copied selection.
			 * 
			 * @type Uint8ClampedArray
			 * @private
			 * @since 0.0.21-alpha
			 * @memberof! dusk.tiles.sgui.EditableTileMap#
			 */
			this._clipboard = null;
			
			//Prop masks
			this._mapper.map("cursorColour", "cursorColour");
			this._mapper.map("cursorColor", "cursorColour");
			this._mapper.map("globalCoords", "globalCoords");
			this._mapper.map("frameWidth", "frameWidth");
			this._mapper.map("frameHeight", "frameHeight");
			
			//Listeners
			this.onPaint.listen(this._draw.bind(this));
			this.frame.listen(this._frame.bind(this));
			
			// Set image path
			this.onControl.listen((function(e) {
				if(editor.active) {
					this.src = prompt("Please enter an image path.", this.src);
					this.drawAll();
				}
			}).bind(this), controls.addControl("editabletm_path", "I"));
			
			// Set animation
			this.onControl.listen((function(e) {
				if(editor.active) {
					var tile = this.getTile(this._cx, this._cy);
					
					var ani = TileMap.getAnimation(this.src, tile);
					var anistr = "";
					for(var i = 0; i < ani.length; i ++) {
						if(i) anistr += " ";
						anistr += ani[i];
					}
					
					TileMap.setAnimation(this.src, prompt(
						"Enter a (whitespace seperated) animation for "+tile[0]+","+tile[1],
						anistr
					).split(/\s+/));
					
					TileMap.tileData.free(tile);
					this.drawAll();
				}
			}).bind(this), controls.addControl("editabletm_animation", "E"));
			
			// Copy/paste
			this.onControl.listen(this._copy.bind(this), controls.addControl("editabletm_copy", "C"));
			this.onControl.listen(this._paste.bind(this), controls.addControl("editabletm_paste", "P"));
			//this.onControl.listen(_solid.bind(this), controls.addControl("editabletm_solid", "X"));
			//this.onControl.listen(_weight.bind(this), controls.addControl("editabletm_weight", "W"));
			//this.onControl.listen(_addWeight.bind(this), controls.addControl("editabletm_add_weight", "K"));
			
			//Directions
			this.dirPress.listen(this._rightAction.bind(this), c.DIR_RIGHT);
			this.dirPress.listen(this._leftAction.bind(this), c.DIR_LEFT);
			this.dirPress.listen(this._upAction.bind(this), c.DIR_UP);
			this.dirPress.listen(this._downAction.bind(this), c.DIR_DOWN);
		}
		
		/** Used internally to draw the frame around tiles that are being edited.
		 * @param {object} e A draw event.
		 * @private
		 */
		_draw(e) {
			if(!this.focused || !editor.active) return;
			
			if(-e.d.slice.x + (this._cx*this.tileWidth()) > e.d.dest.width) return;
			if(-e.d.slice.y + (this._cy*this.tileHeight()) > e.d.dest.height) return;
			
			var width = this.tileWidth()*this.frameWidth;
			var height = this.tileHeight()*this.frameHeight;
			if(-e.d.slice.x + (this._cx*this.tileWidth()) + width > e.d.dest.width)
				width = (e.d.dest.width) - (-e.d.slice.x + (this._cx*this.tileWidth()));
			if(-e.d.slice.y + (this._cy*this.tileHeight()) + height > e.d.dest.height)
				height = (e.d.dest.height) - (-e.d.slice.y + (this._cy*this.tileHeight()));
			
			e.c.strokeStyle = this.cursorColour;
			e.c.lineWidth = 1;
			e.c.strokeRect(e.d.dest.x - e.d.slice.x + (this._cx*this.tileWidth()),
				e.d.dest.y - e.d.slice.y + (this._cy*this.tileHeight()), width, height
			);
			
			e.c.fillStyle = this.cursorColour;
			var t = this.getTile(this._cx, this._cy);
			e.c.fillText(t[0]+","+t[1],
				e.d.dest.x - e.d.slice.x + (this._cx*this.tileWidth()) + 1,
				e.d.dest.y - e.d.slice.y + (this._cy*this.tileHeight()) + 6
			);
			
			if(TileMap.getAnimation(this.src, t[0]+","+t[1]).length > 1) {
				e.c.fillText("\u27F3",
					e.d.dest.x - e.d.slice.x + ((this._cx+1)*this.tileWidth()) - 9,
					e.d.dest.y - e.d.slice.y + ((this._cy+1)*this.tileHeight()) - 4
				);
			}
			
			TileMap.tileData.free(t);
		}
		
		/** Called every frame, it updates the global editor coordinates if appropriate.
		 * @param {object} e An event object from `{@link dusk.sgui.Component#frame}`.
		 * @private
		 */
		_frame(e) {
			if(this.globalCoords) {
				if(this.focused && editor.active) {
					EditableTileMap.globalEditX = this._cx;
					EditableTileMap.globalEditY = this._cy;
					EditableTileMap.globalEditWidth = this.frameWidth;
					EditableTileMap.globalEditHeight = this.frameHeight;
				}else{
					this._cx = EditableTileMap.globalEditX;
					this._cy = EditableTileMap.globalEditY;
					this.frameWidth = EditableTileMap.globalEditWidth;
					this.frameHeight = EditableTileMap.globalEditHeight;
				}
			}
		}
		
		/** Sets the entire frame to the current tile.
		 * @param {integer} xt The x of the tile to set.
		 * @param {integer} yt The y of the tile to set.
		 * @private
		 * @since 0.0.21-alpha
		 */
		_set(xt, yt) {
			for(var x = this.frameWidth-1; x >= 0; x --) {
				for(var y = this.frameHeight-1; y >= 0; y --) {
					this.setTile(this._cx+x, this._cy+y, xt, yt);
				}
			}
		}
		
		/** Does a copy operation, copying the current frame to a storage area.
		 * 
		 * This does not actually set it to the user's clipboard
		 * @param {object} e An event object.
		 * @private
		 * @since 0.0.21-alpha
		 */
		_copy(e) {
			if(e.ctrl || !editor.active) return true;
			
			this._clipboard = [];
			
			var p = 0;
			for(var x = this.frameWidth-1; x >= 0; x --) {
				for(var y = this.frameHeight-1; y >= 0; y --) {
					var t = this.getTile(this._cx+x, this._cy+y);
					this._clipboard[p++] = [];
					this._clipboard[p-1][0] = t[0];
					this._clipboard[p-1][1] = t[1];
					TileMap.tileData.free(t);
				}
			}
			
			return false;
		}
		
		/** Does a paste operation, coping the current frame from the storage area to the map.
		 * @param {object} e An event object.
		 * @private
		 * @since 0.0.21-alpha
		 */
		_paste(e) {
			if(e.ctrl || e.alt || !editor.active) return true;
			
			var p = 0;
			for(var x = this.frameWidth-1; x >= 0; x --) {
				for(var y = this.frameHeight-1; y >= 0; y --) {
					var tile = this._clipboard[p++];
					this.setTile(this._cx+x, this._cy+y, tile[0], tile[1]);
				}
			}
			this.drawAll();
			
			return false;
		}
		
		/** Used to manage what happens when "up" is pressed, and any other keyboard combinations.
		 * @param {object} e An event object from `dirPress`.
		 * @return {boolean} True if this event should bubble up to the container, else false.
		 * @private
		 */
		_upAction(e) {
			if(e.e.ctrl || !editor.active) return true;
			if(e.e.shift) {
				var current = this.getTile(this._cx, this._cy);
				current[1] --;
				this._set(current[0], current[1]);
				TileMap.tileData.free(current);
				this.drawAll();
				return false;
			}
			
			if(keyboard.isKeyPressed(65)) {
				if(this.alpha+0.1 >= 1) {this.alpha = 1;} else {this.alpha += 0.1;}
				return false;
			}
			
			if(keyboard.isKeyPressed(70)) {
				this.frameHeight--;
				return false;
			}
			
			if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
				this._noFlow = true;
				return true;
			}
			
			if(this._cy) this._cy --;
		}
		
		/** Used to manage what happens when "down" is pressed, and any other keyboard combinations.
		 * @param {object} e An event object from `dirPress`.
		 * @return {boolean} True if this event should bubble up to the container, else false.
		 * @private
		 */
		_downAction(e) {
			if(e.e.ctrl || !editor.active) return true;
			if(e.e.shift) {
				var current = this.getTile(this._cx, this._cy);
				current[1] ++;
				this._set(current[0], current[1]);
				TileMap.tileData.free(current);
				this.drawAll();
				return false;
			}
			
			if(keyboard.isKeyPressed(65)) {
				if(this.alpha-0.1 <= 0) {this.alpha = 0;} else {this.alpha -= 0.1;}
				return false;
			}
			
			if(keyboard.isKeyPressed(70)) {
				this.frameHeight ++;
				return false;
			}
			
			if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
				this._noFlow = true;
				return true;
			}
			
			this._cy ++;
		}
		
		/** Used to manage what happens when "right" is pressed, and any other keyboard combinations.
		 * @param {object} e An event object from `dirPress`.
		 * @return {boolean} True if this event should bubble up to the container, else false.
		 * @private
		 */
		_rightAction(e) {
			if(e.e.ctrl || !editor.active) return true;
			if(e.e.shift) {
				var current = this.getTile(this._cx, this._cy);
				current[0] ++;
				this._set(current[0], current[1]);
				TileMap.tileData.free(current);
				this.drawAll();
				return false;
			}
			
			if(keyboard.isKeyPressed(65)) {
				if(this.alpha+0.1 >= 1) {this.alpha = 1;} else {this.alpha += 0.1;}
				return false;
			}
			
			if(keyboard.isKeyPressed(70)) {
				this.frameWidth ++;
				return false;
			}
			
			if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
				this._noFlow = true;
				return true;
			}
			
			this._cx ++;
		}
		
		/** Used to manage what happens when "left" is pressed, and any other keyboard combinations.
		 * @param {object} e An event object from `dirPress`.
		 * @return {boolean} True if this event should bubble up to the container, else false.
		 * @private
		 */
		_leftAction(e) {
			if(e.e.ctrl || !editor.active) return true;
			if(e.e.shift) {
				var current = this.getTile(this._cx, this._cy);
				current[0] --;
				this._set(current[0], current[1]);
				TileMap.tileData.free(current);
				this.drawAll();
				return false;
			}
			
			if(keyboard.isKeyPressed(65)) {
				if(this.alpha-0.1 <= 0) {this.alpha = 0;} else {this.alpha -= 0.1;}
				return false;
			}
			
			if(keyboard.isKeyPressed(70)) {
				this.frameWidth --;
				return false;
			}
			
			if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
				this._noFlow = true;
				return true;
			}
			
			if(this._cx) this._cx --;
		}
		
		/** Removes the topmost row of tiles, and moves all other tiles up one to compensate. */
		carveTop() {
			this.rows --;
			var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
			var newTiles = new Uint8ClampedArray(newTileBuffer);
			
			var point = this.cols<<1;
			for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
				newTiles[i] = this._tiles[0][point++];
			}
			
			this._tileBuffer[0] = newTileBuffer;
			this._tiles[0] = new Uint8ClampedArray(this._tileBuffer[0]);
			this.drawAll();
		}
		
		/** Adds a new row to the top of the tilemap, and moves all other tiles down to compensate. */
		graftTop() {
			this.rows ++;
			var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
			var newTiles = new Uint8ClampedArray(newTileBuffer);
			
			var point = 0;
			for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
				if(i < this.cols << 1) {
					newTiles[i] = 0;
					continue;
				}
				
				newTiles[i] = this._tiles[0][point++];
			}
			
			this._tileBuffer[0] = newTileBuffer;
			this._tiles[0] = new Uint8ClampedArray(this._tileBuffer[0]);
			this.drawAll();
		}
		
		/** Removes the bottommost row of the tilemap. */
		carveBottom() {
			this.rows --;
			var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
			var newTiles = new Uint8ClampedArray(newTileBuffer);
			
			var point = 0;
			for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
				newTiles[i] = this._tiles[0][point++];
			}
			
			this._tileBuffer[0] = newTileBuffer;
			this._tiles[0] = new Uint8ClampedArray(this._tileBuffer[0]);
			this.drawAll();
		}
		
		/** Adds a new row to the bottom of the tilemap. */
		graftBottom() {
			this.rows ++;
			var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
			var newTiles = new Uint8ClampedArray(newTileBuffer);
			
			var point = 0;
			for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
				if(point >= this._tiles[0].length) {
					newTiles[i] = 0;
					continue;
				}
				
				newTiles[i] = this._tiles[0][point++];
			}
			
			this._tileBuffer[0] = newTileBuffer;
			this._tiles[0] = new Uint8ClampedArray(this._tileBuffer[0]);
			this.drawAll();
		}
		
		/** Adds a new column onto the left of this tilemap, shifting all other cols right to compensate. */
		graftLeft() {
			this.cols ++;
			var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
			var newTiles = new Uint8ClampedArray(newTileBuffer);
			
			var point = 0;
			for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
				if(i % (this.cols<<1) == 0) {
					newTiles[i++] = 0;
					newTiles[i] = 0;
					continue;
				}
				
				newTiles[i] = this._tiles[0][point++];
			}
			
			this._tileBuffer[0] = newTileBuffer;
			this._tiles[0] = new Uint8ClampedArray(this._tileBuffer[0]);
			this.drawAll();
		}
		
		/** Removes a column from the left of this tilemap, shifting all other cols left to compensate. */
		carveLeft() {
			this.cols --;
			var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
			var newTiles = new Uint8ClampedArray(newTileBuffer);
			
			var point = 0;
			for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
				if(i % (this.cols<<1) == 0) {
					point += 2;
				}
				
				newTiles[i] = this._tiles[0][point++];
			}
			
			this._tileBuffer[0] = newTileBuffer;
			this._tiles[0] = new Uint8ClampedArray(this._tileBuffer[0]);
			this.drawAll();
		}
		
		/** Adds a new column to the right of this tilemap. */
		graftRight() {
			this.cols ++;
			var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
			var newTiles = new Uint8ClampedArray(newTileBuffer);
			
			var point = 0;
			for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
				if((i+2) % (this.cols<<1) == 0) {
					newTiles[i++] = 0;
					newTiles[i] = 0;
					continue;
				}
				
				newTiles[i] = this._tiles[0][point++];
			}
			
			this._tileBuffer[0] = newTileBuffer;
			this._tiles[0] = new Uint8ClampedArray(this._tileBuffer[0]);
			this.drawAll();
		}
		
		/** Removes a column from the right of this tilemap. */
		carveRight() {
			this.cols --;
			var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
			var newTiles = new Uint8ClampedArray(newTileBuffer);
			
			var point = 0;
			for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
				if((i+1) % (this.cols<<1) == 0) {
					point+=2;
				}
				
				newTiles[i] = this._tiles[0][point++];
			}
			
			this._tileBuffer[0] = newTileBuffer;
			this._tiles[0] = new Uint8ClampedArray(this._tileBuffer[0]);
			this.drawAll();
		}
	}
	
	/** This is the tile x coordinate for all editable tilemaps that have `globalCoords` to true.
	 * @type integer
	 * @static
	 * @memberof! dusk.tiles.sgui.EditableTileMap#
	 */
	EditableTileMap.globalEditX = 0;
	/** This is the tile y coordinate for all editable tilemaps that have `globalCoords` to true.
	 * @type integer
	 * @static
	 * @memberof! dusk.tiles.sgui.EditableTileMap#
	 */
	EditableTileMap.globalEditY = 0;
	/** This is the frame height for all editable tilemaps that have `globalCoords` to true.
	 * @type integer
	 * @static
	 * @memberof! dusk.tiles.sgui.EditableTileMap#
	 */
	EditableTileMap.globalEditHeight = 1;
	/** This is the frame width for all editable tilemaps that have `globalCoords` to true.
	 * @type integer
	 * @static
	 * @memberof! dusk.tiles.sgui.EditableTileMap#
	 */
	EditableTileMap.globalEditWidth = 1;
	
	sgui.registerType("EditableTileMap", EditableTileMap);
	
	return EditableTileMap;
});
