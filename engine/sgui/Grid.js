//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Grid", (function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var utils = load.require("dusk.utils");
	
	/** A grid is a group of similar components arranged in a grid.
	 * 
	 * A population is created using the `populate` method  with an object representation containing a type name.
	 *  This will then create numerous copies of that component, in a grid of dimensions `rows` by `cols` with the same
	 *  data.
	 * 
	 * Components are named in the form `"x,y"`, where x and y are the coordinates of the component; the second one to
	 *  the right of the first row will be `"1,0"` for example. This class will, provided the event bubbles from it's
	 *  children, manage focus changing between elements.
	 * 
	 * Properties in the `globals` object will be applied to all children in the grid when they are added.
	 * 
	 * If the child to add is an array, then it will alternate between all the elements in the array as children in
	 *  order. If `multiple` is true, then it will loop round when it reaches the end of the array and start again.
	 *  If `multiple` is false, then it will stop; this makes groups a really usefull way of populating a group of
	 *  elements dynamically. 
	 * 
	 * @extends dusk.sgui.Group
	 * @param {?dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @constructor
	 */
	var Grid = function (parent, name) {
		Group.call(this, parent, name);
		
		/** The number of rows that are to be created when the grid is populated.
		 * @type integer
		 * @default 5
		 */
		this.rows = 5;
		/** The number of columns that are to be created when the grid is populated.
		 * @type integer
		 * @default 5
		 */
		this.cols = 5;
		
		/** The space, in pixels, between each grid component horizontally.
		 * @type integer
		 * @default 0
		 */
		this.hspacing = 0;
		/** The space, in pixels, between each grid component vertically.
		 * 
		 * This takes the value of the theme key `grid.vspacing`, which by default is `0`.
		 * @type integer
		 * @default 0
		 */
		this.vspacing = 0;
		
		/** Global properties. These will be set to all children during population.
		 * @type object
		 * @since 0.0.18-alpha
		 */
		this.globals = null;
		
		/** If true, then old components in the grid will be reused when populating.
		 * @type boolean
		 * @since 0.0.21-alpha
		 * @default true
		 */
		this.recycle = true;
		/** If false, then each component description while populating will only be used once.
		 * @type boolean
		 * @since 0.0.21-alpha
		 * @default true
		 */
		this.multiple = true;
		
		/** This event handler is fired during three stages of the population proccess; when it starts,
		 *  when a component is created, and when it finishes.
		 * 
		 * The event object has up to three properties:
		 * - `child` The child object data, this may be changed.
		 * - `action` Either `"before"`, `"create"` or `"complete"` depending on the population stage.
		 * - `component` Only on `create` events. This is the component that was created.
		 * - `current` Only on `create` events. This is the object that was used to create the component.
		 * 
		 * The handler MUST return the event object when it is finished with it.
		 * @type dusk.utils.EventDispatcher
		 * @protected
		 * @since 0.0.17-alpha
		 */
		this._populationEvent = new EventDispatcher("dusk.sgui.Grid._populationEvent");
		
		//Prop masks
		this._registerPropMask("vspacing", "vspacing");
		this._registerPropMask("hspacing", "hspacing");
		this._registerPropMask("rows", "rows");
		this._registerPropMask("cols", "cols");
		this._registerPropMask("globals", "globals");
		this._registerPropMask("recycle", "recycle");
		this._registerPropMask("multiple", "multiple");
		this._registerPropMask("populate", "__populate", undefined,["rows", "cols", "hspacing", "vspacing", "globals",
			"recycle", "multiple"]
		);
		
		//Listeners
		this.dirPress.listen(this._gridDirAction.bind(this));
	};
	Grid.prototype = Object.create(Group.prototype);
	
	/** Creates a new population of the specified component.
	 * 
	 * This will erase all components in this group, and create new ones of the type `value.type`,
	 *  and then call `{@link dusk.sgui.Component.parseProps}` with a copy of `value`.
	 * 
	 * The x and y coordinates will be set automatically.
	 * 
	 * This may take an array as it's argument, in which case it will alternate between the components as it places them.
	 * 
	 * This may be used in the JSON representation with the property `populate`.
	 * 
	 * @param {object|array} child A description of the object or objects to set.
	 */
	Grid.prototype.populate = function(child) {
		if(child === undefined) return;
		if(!Array.isArray(child)) child = [child];
		
		//Fire before event
		child = this._populationEvent.firePass({"action":"before", "child":child}, "before").child;
		
		//Delete all the existing ones, or all the out of range one
		if(!this.recycle) {
			for(var x in this._components){
				this.deleteComponent(x);
			}
		}else{
			for(var x in this._components){
				if(x.split(",")[0] > this.cols-1 || x.split(",")[1] > this.rows-1)
					this.deleteComponent(x);
			}
		}
		
		if(this.rows <= 0 || this.cols <= 0) {
			this._populationEvent.firePass({"action":"complete", "child":child}, "complete");
			return;
		}
		
		var p = -1;
		var xpoint = 0;
		var ypoint = 0;
		var ypointMax = 0;
		
		outer:for(var hy = 0; hy < this.rows; hy++){
			for(var hx = 0; hx < this.cols; hx++){
				if((p + 1) >= child.length && !this.multiple) break outer;
				
				p = (p + 1) % child.length;
				
				// Generate the component
				var com = null;
				if(!("type" in child[p]) && this.globals !== null && "type" in this.globals) {
					com = this.getComponent(hx + "," + hy, this.globals.type);
				}else if("type" in child[p]) {
					com = this.getComponent(hx + "," + hy, child[p].type);
				}else{
					console.warn("Grid tried to populate element with no type.");
				}
				
				// Fire the event
				com = this._populationEvent.firePass({"action":"create", "current":child[p], "child":child, "component":com,
					"globals":this.globals
				}, "create").component;
				
				// Give the component properties
				if(this.globals !== null) com.parseProps(utils.clone(this.globals));
				com.parseProps(utils.clone(child[p]));
				com.parseProps({"y":ypoint, "x":xpoint});
				
				// Set the location of the component
				xpoint += com.width+this.hspacing;
				if(com.height + this.vspacing > ypointMax) ypointMax = com.height + this.vspacing;
			}
			
			ypoint += ypointMax;
			xpoint = 0;
		}
		
		this.flow("0,0");
		
		this._populationEvent.fire({"action":"complete", "child":child}, "complete");
	};
	Object.defineProperty(Grid.prototype, "__populate", {
		set: function(value) {this.populate(value);},
		get: function() {return undefined;}
	});
	
	/** Updates the location of all the components, arranging them back into a grid if, for example,
	 *  they have been moved or the spacing between them has changed.
	 */
	Grid.prototype.adjust = function() {
		for(var hy = 0; hy < this.rows; hy++){
			for(var hx = 0; hx < this.cols; hx++){
				var com = this.getComponent(hx+","+hy);
				if(com) com.parseProps({"y":(hy*com.height+hy*this.vspacing), "x":(hx*com.width+hx*this.hspacing)});
			}
		}
	};
	
	/** Changes the focused component in a grid-y way.
	 * @return {boolean} Whether there was a component to flow into, `false` if so, else `true`.
	 * @protected
	 */
	Grid.prototype._gridDirAction = function(e) {
		if(this.focusBehaviour == Group.FOCUS_ALL) return true;
		
		if(this.componentRelative(this.focus, e.dir)){
			this.flow(this.componentRelative(this.focus, e.dir).name);
			return false;
		}
		
		return true;
	};
	
	/** Returns a component that is next to a component in a specified direction.
	 * @param {string} name The component name that should be checked.
	 * @param {integer} dir A constant like `DIR_*` from `{@link dusk.sgui.Component}` that indicates the direction.
	 * @return {?dusk.sgui.Component} The component in that direction, or `null` if it does not exist.
	 * @since 0.0.17-alpha
	 */
	Grid.prototype.componentRelative = function(name, dir) {
		var cx = name.split(",")[0];
		var cy = name.split(",")[1];
		
		switch(dir) {
			case c.DIR_LEFT:
				return this.getComponent((+cx-1)+","+cy);
			
			case c.DIR_RIGHT:
				return this.getComponent((+cx+1)+","+cy);
			
			case c.DIR_UP:
				return this.getComponent(cx+","+(+cy-1));
			
			case c.DIR_DOWN:
				return this.getComponent(cx+","+(+cy+1));
			
			default:
				console.warn("Invalid direction for relative seen: "+dir);
				return null;
		}
	};
	
	sgui.registerType("Grid", Grid);
	
	return Grid;
})());
