//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Single");

dusk.load.provide("dusk.sgui.DirListener");

/** This is a simple single that allows you to run actions when a direction arrow is pressed.
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;action-up&gt;(actions)&lt;/action-up&gt;</code> --
 * Runs <code>actions</code> when the up direction is pressed. If this is empty, normal flowing occurs.</p>
 * 
 * <p><code>&lt;action-down&gt;(actions)&lt;/action-down&gt;</code> --
 * Runs <code>actions</code> when the down direction is pressed. If this is empty, normal flowing occurs.</p>
 * 
 * <p><code>&lt;action-left&gt;(actions)&lt;/action-left&gt;</code> --
 * Runs <code>actions</code> when the left direction is pressed. If this is empty, normal flowing occurs.</p>
 * 
 * <p><code>&lt;action-right&gt;(actions)&lt;/action-right&gt;</code> --
 * Runs <code>actions</code> when the right direction is pressed. If this is empty, normal flowing occurs.</p>
 */

dusk.sgui.DirListener = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Single.call(this, parent, comName);
		/** This creates a new focus checker! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
			
		this.up = [];
		this.down = [];
		this.left = [];
		this.right = [];
		
		this._registerPropMask("action-up", "up", false);
		this._registerPropMask("action-down", "down", false);
		this._registerPropMask("action-left", "left", false);
		this._registerPropMask("action-right", "right", false);
	}
};
dusk.sgui.DirListener.prototype = new dusk.sgui.Single();
dusk.sgui.DirListener.constructor = dusk.sgui.DirListener;

dusk.sgui.DirListener.prototype.className = "DirListener";

/** This is called when the up key is pressed, and in this object it runs some actions.
 * @return If some code was ran. If no code was ran, then control should flow out of this.
 */
dusk.sgui.DirListener.prototype._upAction = function() {
	if(this._up){
		dusk.events.run(this.up, "_"+this.comName);
		return false;
	}
	
	return true;
};

/** This is called when the down key is pressed, and in this object it runs some actions.
 * @return If some code was ran. If no code was ran, then control should flow out of this.
 */
dusk.sgui.DirListener.prototype._downAction = function() {
	if(this._down){
		dusk.events.run(this.down, "_"+this.comName);
		return false;
	}
	
	return true;
};

/** This is called when the left key is pressed, and in this object it runs some actions.
 * @return If some code was ran. If no code was ran, then control should flow out of this.
 */
dusk.sgui.DirListener.prototype._leftAction = function() {
	if(this._left){
		dusk.events.run(this.left, "_"+this.comName);
		return false;
	}
	
	return true;
};

/** This is called when the right key is pressed, and in this object it runs some actions.
 * @return If some code was ran. If no code was ran, then control should flow out of this.
 */
dusk.sgui.DirListener.prototype._rightAction = function() {
	if(this._right){
		dusk.events.run(this.right, "_"+this.comName);
		return false;
	}
	
	return true;
};
