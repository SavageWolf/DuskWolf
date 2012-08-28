//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.sgui.Image");

/** This is a single image, the image just sits on the screen and does nothing of any relevance.
 * 
 * <p><img src='Image.png'/></p>
 * 
 * <p>Only one image can be displayed at a time, if you try to set another, it'll replace the existing one.</p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;image&gt;(image)&lt;/image&gt;</code> --
 * The image to display, it must be the name of a constant in <code>Data</code>.</p>
 * 
 * @see Data
 */
dusk.sgui.Image = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
	
		/** This is the actual image. */
		this._img = null;
		
		/** This creates a new image! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
		this._registerPropMask("src", "src", true);
		
		this.src = this._theme("img.src", "sgui/img.png");
		
		this._registerDrawHandler(this._imageDraw);
	}
};
dusk.sgui.Image.prototype = new dusk.sgui.Component();
dusk.sgui.Image.constructor = dusk.sgui.Image;

/** @inheritDoc */
dusk.sgui.Image.prototype.className = "Image";

dusk.sgui.Image.prototype._imageDraw = function(c) {
	if(this._img && this._img.complete){
		c.drawImage(this._img, 0, 0, this.width?this.width:this._img.width, this.height?this.height:this._img.height);
	}else if(this._img) {
		this.bookRedraw();
	}
};

/** This sets the image that will be displayed.
 * @param image The name of the image, should be a constant in <code>Data</code>.
 */
dusk.sgui.Image.prototype.__defineSetter__("src", function _setSrc(value) {
	if(!value) {console.warn(this.comName+" tried to set image to nothing."); return;}
	this._img = dusk.data.grabImage(value);
	this.bookRedraw();
});
dusk.sgui.Image.prototype.__defineGetter__("src", function _getSrc(value) {
	return this._img;
});
