//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** A tile is a type of image designed for using tilesets, a single image with lots of smaller ones in. Generally, it has a "viewing area" of a certian size and width, and the image behind it can be moved to show only one tile at a time.
 * 
 * <p>Uh, remember that this extends the <code>image</code> component, and uses the <code>image</code> property of that as the tileset.</p>
 * 
 * <p>The tileset is assumed to be a grid where every tile is the same size, this will fail if you make all the tiles different sizes. The default is 32x32 pixels for a single tile.</p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;tile&gt;(x),(y)&lt;/tile&gt;</code> --
 * The x and y of the tile that will be displayed. Note that this is NOT the coordinates, it's the tile, the second tile to the left will be <code>1,0</code></p>
 * 
 * <p><code>&lt;tile-h&gt;(height)&lt;/tile-h&gt;</code> --
 * The height of a single tile in pixels, the default is 32.</p>
 * 
 * <p><code>&lt;tile-w&gt;(width)&lt;/tile-w&gt;</code> --
 * The width of a single tile in pixels, the default is 32.</p>
 * 
 * <p><b>Vars provided are as follows:</b></p>
 * 
 * <p><code>sg-tile-defHeight</code>: The defualt height of every tile, in pixels. Defualt is 32.</p>
 * <p><code>sg-tile-defWidth</code>: The defualt width of every tile, in pixels. Defualt is 32.</p>
 * 
 * @see Tile
 */
sgui.Tile = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
	
		/** This is the actual image. */
		this._img = null;
		
		if(!this._events.getVar("sg-def-tile-tsize")) this._events.setVar("sg-def-tile-tsize", "5");
		
		this._tsize = this._events.getVar("sg-def-tile-tsize");
		this._width = 1<<this._tsize;
		this._height = 1<<this._tsize;
		this._tx = 0;
		this._ty = 0;
		
		/** This creates a new image! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
		
		this._registerStuff(this._tileStuff);
		this._registerDrawHandler(this._tileDraw);
	}
};
sgui.Tile.prototype = new sgui.Component();
sgui.Tile.constructor = sgui.Tile;


/** @inheritDoc */
sgui.Tile.prototype.className = "Tile";


/** Generic image stuff!
 */
sgui.Tile.prototype._tileStuff = function(data) {
	//Set image
	if(this._prop("src", data, null, true)){
		this.setImage(this._prop("src", data, null, true, 2));
	}
	
	this._tsize = this._prop("tile-size", data, this._tsize, true);
	
	this._tx = this._prop("tile", data, this._tx+","+this._ty, true).split(",")[0];
	this._ty = this._prop("tile", data, this._tx+","+this._ty, true).split(",")[1];
};

sgui.Tile.prototype._tileDraw = function(c) {
	/*if(navigator.userAgent.indexOf(" Chrome/") != -1 || navigator.userAgent.indexOf(" MSIE ") != -1){
		//From http://stackoverflow.com/questions/4875850/how-to-create-a-pixelized-svg-image-from-a-bitmap/4879849
		var zoomx = this.getWidth()/this._twidth;
		var zoomy = this.getHeight()/this._theight;
		
		// Create an offscreen canvas, draw an image to it, and fetch the pixels
		var offtx = document.createElement('canvas').getContext('2d');
		offtx.drawImage(this._img, this._tx*this._twidth, this._ty*this._theight, this._twidth, this._theight, 0, 0, this._twidth, this._theight);
		var wkp = offtx.getImageData(0, 0, this._img.width, this._img.height).data;

		// Draw the zoomed-up pixels to a different canvas context
		for (var x=0; x < this._img.width; ++x){
			for (var y=0; y < this._img.height; ++y){
				// Find the starting index in the one-dimensional image data
				var i = (y*this._img.width + x)*4;
				if(wkp[i+3]){
					this._c.fillStyle = "rgba("+wkp[i]+","+wkp[i+1]+","+wkp[i+2]+","+(wkp[i+3]/255)+")";
					this._c.fillRect(x*zoomx, y*zoomy, zoomx, zoomy);
				}
			}
		}
	}else{*/
	
	if(this._img){
		c.drawImage(this._img, this._tx<<this._tsize, this._ty<<this._tsize, this.getWidth(), this.getHeight(), 0, 0, 1<<this._tsize, 1<<this._tsize);
	}
};

/** This sets the image that will be displayed.
 * @param image The name of the image, should be a constant in <code>Data</code>.
 */
sgui.Tile.prototype.setImage = function(name) {
	this._img = data.grabImage(name);
};
