//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Group");

/** This is a horizontal group of components.
 * 
 * <p><img src='HMenu.png'/></p>
 * 
 * <p>This group arranges components horizontally, and manages the focus relations between them.</p>
 * 
 * <p>It is filled up or "populated" using the property <code>&lt;populate&gt;</code>. Everything in the menu must be of the same type, and are given names as a number starting from 0. The first one is called "0", the second "1", that kind of thing. Components can be accessed in the same way as any other group.</p>
 * 
 * <p>Only one population can be there at a time, if you give another populate property, the current population will be erased.</p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;populate [count='(count)'] [spacing='(spacing)']&gt;(type)&lt;/populate&gt;</code> --
 * Creates a new population of type <code>type</code> containing <code>count</code> (default 5) components with a space of <code>spacing</code> (default 10) spacing between them, in pixels.</p>
 * 
 * @see VMenu
 */
sgui.Grid = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.Group.call(this, parent, events, comName);

		this._rows = this._theme("grid.rows", 5);
		this._cols = this._theme("grid.cols", 5);
		this._hspacing = this._theme("grid.spacing.h", 0);
		this._vspacing = this._theme("grid.spacing.v", 0);
		
		this._registerPropMask("spacing-v", "_vspacing", false);
		this._registerPropMask("spacing-h", "_hspacing", false);
		this._registerPropMask("rows", "_rows", false);
		this._registerPropMask("cols", "_cols", false);
		this._registerProp("populate", this._populate, null, ["rows", "cols"]);
	}
};
sgui.Grid.prototype = new sgui.Group();
sgui.Grid.constructor = sgui.Grid;

sgui.Grid.prototype.className = "Grid";

/** This creates a new population, erasing any existing ones.
 * @param type The type of component to use, without the "sg-" at the start.
 * @param count The number of elements to create.
 * @param spacing The spacing, in pixels, between them.
 */
sgui.Grid.prototype._populate = function(name, value) {
	//Delete all the existing ones
	for(var x in this._components){
		if(x != "blank") this.deleteComponent(x);
	}
	
	//Add them
	for(var hy = 0; hy < this.prop("rows"); hy++){
		for(var hx = 0; hx < this.prop("cols"); hx++){
			var com = this.getComponent(hx+","+hy, value.type);
			com.parseProps(value, this._thread);
			com.parseProps({"y":(hy*com.prop("height")+hy*this._vspacing), "x":(hx*com.prop("width")+hx*this._vspacing)}, this._thread);
		}
	}
	
	this.prop("focus", "0,0");
};

sgui.Grid.prototype.ajust = function() {
	for(var hy = 0; hy < this.rows; hy++){
		for(var hx = 0; hx < this.cols; hx++){
			var com = this.getComponent(hx+","+hy);
			com.doStuff({"y":(hy*com.prop("height")+hy*this._vspacing), "x":(hx*com.prop("width")+hx*this._hspacing)}, this._thread);
		}
	}
};

/** Manages the flowing left of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the left of the list, so flow out of it).
 */
sgui.Grid.prototype._leftAction = function() {
	var cx = this.prop("focus").split(",")[0];
	var cy = this.prop("focus").split(",")[1];
	if(this.getComponent((cx-1)+","+cy)){
		this.focus((cx-1)+","+cy);
		return false;
	}
	
	return true;
};

/** Manages the flowing right of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the right of the list, so flow out of it).
 */
sgui.Grid.prototype._rightAction = function() {
	var cx = this.prop("focus").split(",")[0];
	var cy = this.prop("focus").split(",")[1];
	if(this.getComponent((Number(cx)+1)+","+cy)){
		this.focus((Number(cx)+1)+","+cy);
		return false;
	}
	
	return true;
};

/** Manages the flowing right of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the right of the list, so flow out of it).
 */
sgui.Grid.prototype._upAction = function() {
	var cx = this.prop("focus").split(",")[0];
	var cy = this.prop("focus").split(",")[1];
	if(this.getComponent(cx+","+(cy-1))){
		this.focus(cx+","+(cy-1));
		return false;
	}
	
	return true;
};

/** Manages the flowing right of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the right of the list, so flow out of it).
 */
sgui.Grid.prototype._downAction = function() {
	var cx = this.prop("focus").split(",")[0];
	var cy = this.prop("focus").split(",")[1];
	if(this.getComponent(cx+","+(Number(cy)+1))){
		this.focus(cx+","+(Number(cy)+1));
		return false;
	}
	
	return true;
};
