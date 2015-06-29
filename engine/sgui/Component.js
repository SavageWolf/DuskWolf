//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Component", (function() {
	var utils = load.require("dusk.utils");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var controls = load.require("dusk.input.controls");
	var sgui = load.require("dusk.sgui");
	var Mapper = load.require("dusk.utils.Mapper");
	var Pool = load.require("dusk.utils.Pool");
	var Group = load.suggest("dusk.sgui.Group", function(p) {Group = p});
	var c = load.require("dusk.sgui.c");
	var Root = load.suggest("dusk.sgui.Root", function(p) {Root = p});
	var interaction = load.require("dusk.input.interaction");
	var mouse = load.suggest("dusk.input.mouse", function(p) {mouse = p});
	var PosRect = load.require("dusk.utils.PosRect");
	
	/** A component is a single "thing" that exists in the SimpleGui system. Everything in the Simple GUI system that
	 *  wants to be displayed should have this in its prototype chain.
	 * 
	 * This class doesn't actually display anything itself, classes that inherit from it do. The properties for this
	 *  apply to all components.
	 * 
	 * More information about how this class works is in the documentation for `dusk.sgui`.
	 * 
	 * @param {?dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @see {@link dusk.sgui}
	 * @constructor
	 */
	var Component = function (parent, componentName) {
		/** The parent container that this component is inside.
		 * @type ?dusk.sgui.Component
		 */
		this.container = parent===undefined?null:parent;
		/** This component's name.
		 * @type string
		 */
		this.name = componentName;
		
		/** Whether the component will draw. If false, the component will not render.
		 * @type boolean
		 * @default true
		 */
		this.visible = true;
		/** The component's transparency. A number between 0 and 1, where 0 is fully transparent, and 1 is fully opaque. 
		 * @type float
		 * @default 1.0
		 */
		this.alpha = 1.0;
		
		/** The display mode of the component in the horizontal direction.
		 * 
		 * Must be one of "fixed" or "expand".
		 * @type string
		 * @default "fixed"
		 * @since 0.0.21-alpha
		 */
		this.xDisplay = "fixed";
		/** The display mode of the component in the vertical direction.
		 * 
		 * Must be one of "fixed" or "expand".
		 * @type string
		 * @default "fixed"
		 * @since 0.0.21-alpha
		 */
		this.yDisplay = "fixed";
		
		/** The components x coordinate when the display mode is "fixed". Note that this is relative to where the
		 * component would ordinarily have been placed. For most groups this is the upper left corner, but with for
		 * example grids, it is relative to the upper left corner of the grid cell.
		 * 
		 * @type integer
		 */
		this.x = 0;
		/** The origin point for the x coordinate, this describes where the x coordinate "begins".
		 * 
		 * Must be one of "left", "middle" or "right".
		 * @type string
		 * @default "left"
		 * @since 0.0.18-alpha
		 */
		this.xOrigin = "left";
		/** The components y coordinate when the display mode is "fixed". Note that this is relative to where the
		 * component would ordinarily have been placed. For most groups this is the upper left corner, but with for
		 * example grids, it is relative to the upper left corner of the grid cell.
		 * 
		 * @type integer
		 */
		this.y = 0;
		/** The origin point for the y coordinate, this describes where the y coordinate "begins".
		 * 
		 * Must be one of "top", "middle" or "bottom".
		 * @type string
		 * @default "top"
		 * @since 0.0.18-alpha
		 */
		this.yOrigin = "top";
		
		/** The component's height, in pixels if the display mode is "fixed".
		 * 
		 * Some components do not support setting their dimensions,	in which case you cannot set this to anything other
		 *  than 0.
		 * @type integer
		 */
		this.height = 0;
		/** The component's width, in pixels, if the display mode is "fixed". 
		 * Some components do not support setting their dimensions, in which case you cannot set this to anything other
		 *  than 0.
		 * @type integer
		 */
		this.width = 0;
		/** When the display is "expand", this is empty space around the top, right, bottom and left side.
		 * @type array
		 * @since 0.0.21-alpha
		 */
		this.margins = [0, 0, 0, 0];
		
		/** If set to a string representing a colour ("#ff0000" or "red", for example) this will draw a border
		 *  of that colour around the component. This can be used to check if width and height are set properly.
		 * @type string
		 * @default null
		 */
		this.mark = null;
		/** If set to a string representing a colour ("#ff0000" or "red", for example) this will draw a border
		 *  of that colour around the component if it is active. This should be used to provide a hint to the user as to 
		 *   what is currently selected.
		 * @type string
		 * @default null
		 * @since 0.0.18-alpha
		 */
		this.activeBorder = null;
		
		/** The name of the group's component that will be focused when the left key is pressed
		 *  and `{@link dusk.sgui.Component.leftDirection}` returns true.
		 * @type string
		 */
		this.leftFlow = "";
		/** The name of the group's component that will be focused when the right key is pressed
		 *  and `{@link dusk.sgui.Component.rightDirection}` returns true.
		 * @type string
		 */
		this.rightFlow = "";
		/** The name of the group's component that will be focused when the up key is pressed
		 *  and `{@link dusk.sgui.Component.upDirection}` returns true.
		 * @type string
		 */
		this.upFlow = "";
		/** The name of the group's component that will be focused when the down key is pressed
		 *  and `{@link dusk.sgui.Component.downDirection}` returns true.
		 * @type string
		 */
		this.downFlow = "";
		/** This should be set to true only in a dirPress listener.
		 *  If true, then there will be no attempt at flowing out of the component.
		 * @type boolean
		 * @protected
		 * @since 0.0.18-alpha
		 */
		this._noFlow = false;
		
		/** Fired when a directional key (up, down, left, right) is pressed.
		 * 
		 * The event object has two properties, `dir`, one of the constants `DIR_*` indicating a direction, 
		 *  and `e` the actual keypress event.
		 * 
		 * For the component to flow to the relevent flow location, all listeners registered must return true.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.17-alpha
		 */
		this.dirPress = new EventDispatcher("dusk.sgui.Component.dirPress", EventDispatcher.FILTER_MULTI);
		/** Fired when an interaction event is fired.
		 * 
		 * All listeners must return true if you want it to bubble up to its parent.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.onInteract = new EventDispatcher("dusk.sgui.Component.onInteract");
		/** Fired when a control event is fired.
		 * 
		 * All listeners must return true if you want it to bubble up to its parent.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.onControl = new EventDispatcher("dusk.sgui.Component.onControl", EventDispatcher.FILTER_ISIN);
		/** An event dispatcher that is fired once per frame.
		 * 
		 * The event object has no properties.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.17-alpha
		 */
		this.frame = new EventDispatcher("dusk.sgui.Component.frame");
		/** An event dispatcher that is fired when the action control `"sgui_action"` is pressed.
		 * 	By default, this is the "space" key, and should be the key that would press a button, or so.
		 * 
		 * This is in AND mode, so that any function registered to this that returns `false`
		 *  will stop the event bubbling to the container component.
		 * 
		 * This has a single event object, `component`, which is the component that fired this event.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.17-alpha
		 */
		this.action = new EventDispatcher("dusk.sgui.Component.action");
		/** An event dispatcher that is fired when the action control `"sgui_cancel"` is pressed.
		 * 	By default, this is the "esc" key, and should be the key that would cancel a selection.
		 * 
		 * This is in AND mode, so that any function registered to this that returns `false`
		 *  will stop the event bubbling to the container component.
		 * 
		 * This has a single event object, `component`, which is the component that fired this event.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.cancel = new EventDispatcher("dusk.sgui.Component.cancel");
		/** Fired as part of the drawing proccess.
		 * 
		 * The event object is a 2D canvas rendering context, which is expected to be drawn on.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.17-alpha
		 */
		this.onPaint = new EventDispatcher("dusk.sgui.Component.onPaint");
		
		/** A mapper used to map JSON properties to the properties on this object.
		 * @type dusk.utils.Mapper
		 * @protected
		 */
		this._mapper = new Mapper(this);
		/** An event dispatcher which fires when the element is deleted.
		 * 
		 * The event object has a single property named `component`, which is this.
		 * 
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.15-alpha
		 */
		this.onDelete = new EventDispatcher("dusk.sgui.Component.onDelete");
		
		/** The component's "style", or an array of such values. Used for styling.
		 * @type string|array
		 * @default ""
		 */
		this.style = "";
		
		/** Whether focus should be changed to this component if the user rolls over it with the mouse, and the
		 *  container allows it.
		 * 
		 * @type boolean
		 * @default true
		 * @since 0.0.20-alpha
		 */
		this.allowMouse = false;
		/** Whether clicking on this component will trigger its action.
		 * 
		 * @type boolean
		 * @since 0.0.20-alpha
		 */
		this.mouseAction = true;
		/** If true, then this component cannot be clicked but will not block click events to any component
		 *  underneath it.
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.clickPierce = false;
		/** Current x location of the mouse, relative to this component.
		 * @type integer
		 * @since 0.0.20-alpha
		 */
		this.mouseX = 0;
		/** Current y location of the mouse, relative to this component.
		 * @type integer
		 * @since 0.0.20-alpha
		 */
		this.mouseY = 0;
		/** True if this component has the mouse hovered over it.
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.mouseHovered = false;
		/** The mouse cursor to be used when this component is hovered over.
		 * 
		 * An empty string is the default value.
		 * @type string
		 * @since 0.0.21-alpha
		 */
		this.mouseCursor = "";
		/** Fired when this component is clicked on.
		 * 
		 * The event object has at least a property `button`, which is the number of the button clicked.
		 * @type dusk.utils.EventDispatcher
		 */
		this.onClick = new EventDispatcher("dusk.sgui.Component.onClick");
		
		
		/** Whether the component can become focused, if false it cannot be flowed into. 
		 * @type boolean
		 * @default true
		 */
		this.enabled = true;
		/** Whether the component can loose focus, if true it can't be flowed out of. 
		 * @type boolean
		 * @default false
		 */
		this.locked = false;
		
		/** Whether this component is focused or not.
		 * @type boolean
		 * @default false
		 */
		this.focused = false;
		/** Whether this component is currently the active one.
		 * @type boolean
		 * @default false
		 */
		this.active = false;
		/** Fired whenever this component becomes focused, or looses focus.
		 * 
		 * The event object has a single property, `focus`, which is true if and only if the component is now focused.
		 * @type dusk.utils.EventDispatcher
		 */
		this.onFocusChange = new EventDispatcher("dusk.sgui.Component.onFocusChange");
		this.onFocusChange.listen((function(e){this.focused = e.focus;}).bind(this));
		/** Fired whenever this component becomes active, or stops being active.
		 * 
		 * The event object has a single property, `active`, which is true if and only if the component is now active.
		 * @type dusk.utils.EventDispatcher
		 */
		this.onActiveChange = new EventDispatcher("dusk.sgui.Component.onActiveChange");
		this.onActiveChange.listen((function(e){this.active = e.active;}).bind(this));
		
		/** If this component becomes focused, then the components specified by these paths will also become focused.
		 * 
		 * @type array
		 * @since 0.0.21-alpha
		 */
		this.alsoFocus = [];
		this.onFocusChange.listen((function(e){
			if(this.alsoFocus) {
				for(var i = this.alsoFocus.length-1; i >= 0; i --) {
					if(this.path(this.alsoFocus[i]) && this.path(this.alsoFocus[i]).container) {
						this.path(this.alsoFocus[i]).container.flow(this.path(this.alsoFocus[i]).name);
					}
				}
			}
		}).bind(this), true);
		
		/** If this component's action fires, then the components specified by these paths will become focused.
		 * 
		 * If any components are focused due to this, then the action event isn't bubbled to the container.
		 * 
		 * @type array
		 * @since 0.0.21-alpha
		 */
		this.actionFocus = [];
		this.action.listen((function(e){
			var toReturn = true;
			if(this.actionFocus) {
				for(var i = this.actionFocus.length-1; i >= 0; i --) {
					if(this.path(this.actionFocus[i]) && this.path(this.actionFocus[i]).container) {
						this.path(this.actionFocus[i]).container.flow(this.path(this.actionFocus[i]).name);
						toReturn = false;
					}
				}
			}
			return toReturn;
		}).bind(this));
		
		/** If the component is deleted from its group.
		 * 
		 * Set this to true to delete the component.
		 * 
		 * This will tell the parent component to remove the child, however it will not remove any other references to
		 *  it.
		 * @type boolean
		 */
		this.deleted = false;
		/** Stores internally whether the current component is deleted.
		 * @type boolean
		 * @private
		 */
		this._deleted = false;
		
		/** Stores all the extras connected to this component. Key names are extra names, and the values are the values.
		 * @type object
		 * @private
		 * @since 0.0.18-alpha
		 */
		this._extras = {};
		
		/** The component's type. Setting this to a string will change the component to that type.
		 * @type string
		 * @since 0.0.20-alpha
		 */
		this.type = null;
		
		//Prop masks
		this._mapper.map("xDisplay", "xDisplay");
		this._mapper.map("yDisplay", "yDisplay");
		this._mapper.map("margins", "margins");
		this._mapper.map("x", "x");
		this._mapper.map("xOrigin", "xOrigin");
		this._mapper.map("y", "y");
		this._mapper.map("yOrigin", "yOrigin");
		this._mapper.map("width", "width");
		this._mapper.map("height", "height");
		this._mapper.map("alpha", "alpha");
		this._mapper.map("visible", "visible");
		this._mapper.map("mark", "mark");
		this._mapper.map("activeBorder", "activeBorder");
		this._mapper.map("upFlow", "upFlow");
		this._mapper.map("downFlow", "downFlow");
		this._mapper.map("leftFlow", "leftFlow");
		this._mapper.map("rightFlow", "rightFlow");
		this._mapper.map("enabled", "enabled");
		this._mapper.map("deleted", "deleted");
		this._mapper.map("name", "name");
		this._mapper.map("style", "style");
		this._mapper.map("layer", [function() {return "";}, this.alterLayer]);
		this._mapper.map("extras", [function() {return {};}, this.updateMultipleExtras]);
		this._mapper.map("type", "type");
		this._mapper.map("allowMouse", "allowMouse");
		this._mapper.map("mouse.allow", "allowMouse");
		this._mapper.map("mouseAction", "mouseAction");
		this._mapper.map("mouse.action", "mouseAction");
		this._mapper.map("mouseCursor", "mouseCursor");
		this._mapper.map("clickPierce", "clickPierce");
		this._mapper.map("mouse.clickPierce", "clickPierce");
		this._mapper.map("alsoFocus", "alsoFocus");
		this._mapper.map("actionFocus", "actionFocus");
		
		//this.mark = "#ff0000";
	};
	
	
	/** This causes the component to handle an interaction, it should be called by either its parent container or
	 *  SimpleGui.
	 * 
	 * This function will first check the interaction to see if it is bound to the direction or the action control, if
	 *  it is ether the action handlers or the "directionAction"s are called. Otherwise it looks for a keyhandler. If
	 *  all of the action handlers or keyhandlers returns true, then this function will return true.
	 * 
	 * This function returns true if either at least one keyHandler (including action and direction) returns true, or 
	 *  the control flows into another component. If this returns false, then the event must not be ran by its 
	 *  container.
	 * 
	 * @param {object} e The interaction event.
	 * @return {boolean} Whether the parent container should run its own actions.
	 */
	Component.prototype.interact = function(e) {
		this._noFlow = false;
		
		var dirReturn = this.onInteract.fireAnd(e, e.filter);
		
		// If the mouse cursor needs to be changed, do it
		if(this.mouseCursor && e.type == interaction.MOUSE_MOVE && this.active && this.focused
		&& this.mouseHovered && mouse) {
			mouse.cursor = this.mouseCursor;
		}
		
		if(dirReturn) {
			// Directions
			var cons = controls.interactionControl(e);
			if(cons.indexOf("sgui_left") !== -1) {
				if((dirReturn = this.dirPress.fireAnd({"dir":c.DIR_LEFT, "e":e}, c.DIR_LEFT)) && !this._noFlow
				&& this.leftFlow && this.container.flow(this.leftFlow)) return false;
			
			}else if(cons.indexOf("sgui_up") !== -1) {
				if((dirReturn = this.dirPress.fireAnd({"dir":c.DIR_UP, "e":e}, c.DIR_UP)) && !this._noFlow
				&& this.upFlow && this.container.flow(this.upFlow)) return false;
			
			}else if(cons.indexOf("sgui_right") !== -1) {
				if((dirReturn = this.dirPress.fireAnd({"dir":c.DIR_RIGHT, "e":e}, c.DIR_RIGHT)) && !this._noFlow
				&& this.rightFlow && this.container.flow(this.rightFlow)) return false;
			
			}else if(cons.indexOf("sgui_down") !== -1) {
				if((dirReturn = this.dirPress.fireAnd({"dir":c.DIR_DOWN, "e":e}, c.DIR_DOWN)) && !this._noFlow
				&& this.downFlow && this.container.flow(this.downFlow)) return false;
			
			}else if(cons.indexOf("sgui_action") !== -1) {
				return this.action.fireAnd({"keyPress":e, "component":this});
			
			}else if(cons.indexOf("sgui_cancel") !== -1) {
				return this.cancel.fireAnd({"keyPress":e, "component":this});
			}
		}
		
		return dirReturn;
	};
	
	/** This causes the component to handle a control event, it should be called by either its parent container or
	 *  SimpleGui.
	 * 
	 * This function returns true if either at least one keyHandler (including action and direction) returns true, or 
	 *  the control flows into another component. If this returns false, then the event must not be ran by its 
	 *  container.
	 * 
	 * @param {object} e An interaction event.
	 * @param {array} controls The controls that match this event.
	 * @return {boolean} Whether the parent container should run its own actions.
	 */
	Component.prototype.control = function(e, controls) {
		var dirReturn = this.onControl.fireAnd(e, controls);
		
		return dirReturn;
	};
	
	/** Handles a mouse click. This will fire `{@link dusk.sgui.Component#onClick}`, and possibly fire the 
	 *  `{@link dusk.sgui.Component#action}` handler.
	 * 
	 * If the component running this is a group 
	 *  then its `{@link dusk.sgui.Group#containerClick}` function will be called.
	 *	If that function returns true, then this shall return true without doing anything else.
	 * 
	 * @param {object} e The click event.
	 * @return {boolean} Whether the parent container should run its own actions.
	 */
	Component.prototype.doClick = function(e) {
		if(this instanceof Group && !this.containerClick(e))
			return false;
		
		if(this.onClick.fireAnd(e)) {
			if(this.mouseAction && this.allowMouse) {
				return this.action.fireAnd({"click":e, "component":this});
			}
		}
		
		return true;
	};
	
	/** Given an object, this function sets the properties of this component in relation to it.
	 * 
	 * This is used to describe the component using JSON.
	 * 
	 * The properties of the `props` object tend to match up with the names of public properties of the class
	 *  (any changes will be noted in the documentation).
	 * 
	 * This function will loop through all the properties is `props`
	 *  and set that value to the corresponding value in this object.
	 * 
	 * @param {object} props The object to read the properties from.
	 */
	Component.prototype.update = function(props) {
		this._mapper.update(props);
	};
	
	/** Returns or sets a single property of the component.
	 *	See `{@link dusk.sgui.Component#update}` for details on how properties work.
	 * 
	 * If value is omitted, no value will be set.
	 * 
	 * @param {string} name The property to set.
	 * @param {?*} value The new value to set for the object.
	 * @return {?*} The (new) value of the object, or null if no property by that name can be handled.
	 * @see {dusk.sgui.Component#update}
	 */
	Component.prototype.prop = function(name, value) {
		if(value === undefined) return this._mapper.get(name);
		
		return this._mapper.set(name, value);
	};
	
	/** "Bundles up" the component into a simple object.
	 * 
	 * This loops through all the registered propHandlers and sets them on an object.
	 * 	This object should be able to describe the component.
	 * @return {object} A representation of this component.
	 * @since 0.0.17-alpha
	 */
	Component.prototype.bundle = function() {
		return this._mapper.massGet();
	};
	
	
	//deleted
	Object.defineProperty(Component.prototype, "deleted", {
		set: function (value) {
			if(value && !this._deleted) {
				this._deleted = true;
				this.container.delete(this.name);
			}
		},
		
		get: function() {
			return this._deleted;
		}
	});
	
	/** Used by containers, similar to `paint`, but allows you to specify what part of an image to take, and where
	 *  exactly to put it. Also supports "expand" components.
	 * 
	 * This will also update the mouse location.
	 * 
	 * @param {CanvasRenderingContext2D} ctx The canvas to draw onto.
	 * @param {PosRect} container The dimensions of the container that this component is in. The x and y are unused.
	 * @param {PosRect} containerSlice The slice of the container that is being rendered, anything outwith these
	 *  dimensions will not be rendered.
	 * @param {PosRect} display The area (on the canvas) to actually draw onto.
	 * @since 0.0.21-alpha
	 */
	Component.prototype.paintContainer = function(ctx, container, containerSlice, display) {
		// Check if we can skip rendering
		if((!this.visible || this.alpha <= 0) && !this.mouse) return;
		
		// Transparency
		var oldAlpha = -1;
		var alpha = this.alpha;
		if(this.alpha != ctx.globalAlpha && this.alpha != 1) {
			oldAlpha = ctx.globalAlpha;
			ctx.globalAlpha *= this.alpha;
		}
		
		// From the component with these dimensions
		var source = PosRect.pool.alloc();
		// Slice this bit out of it
		var slice = PosRect.pool.alloc();
		// And put it here
		var dest = PosRect.pool.alloc();
		
		// Calculate source
		source.setWH(0, 0, this.width, this.height);
		
		if(this.xDisplay == "fixed") {
			if(this.xOrigin == "right") source.shift(container.width - this.width, 0);
			if(this.xOrigin == "middle") source.shift((container.width - this.width) >> 1, 0);
			
			source.shift(this.x, 0);
		}else{
			source.setXY(this.margins[3], source.y, container.width - this.margins[1], source.ey);
		}
		
		if(this.yDisplay == "fixed") {
			if(this.yOrigin == "bottom") source.shift(0, container.height - this.height);
			if(this.yOrigin == "middle") source.shift(0, (container.height - this.height) >> 1);
		
			source.shift(0, this.y);
		}else{
			source.setXY(source.x, this.margins[0], source.ex, container.height - this.margins[2]);
		}
		
		// Then calculate the slice and dest
		dest.setWH(
			source.x + display.x - containerSlice.x,
			source.y + display.y - containerSlice.y,
			source.width, source.height
		);
		
		// Range check
		if(dest.x < display.x) dest.startSize(-(display.x - dest.x), 0);
		if(dest.y < display.y) dest.startSize(0, -(display.y - dest.y));
		if(dest.ex > display.ex) dest.size(-(dest.ex - display.ex), 0);
		if(dest.ey > display.ey) dest.size(0, -(dest.ey - display.ey));
		
		// Check if on screen
		var skip = false;
		if(dest.width <= 0 || dest.height <= 0) skip = true;
		
		// Update mouse location
		if(true) {
			var x = this.getRoot().mouseX - dest.x// + slice.x;
			var y = this.getRoot().mouseY - dest.y// + slice.y;
			
			if(x >= 0 && y >= 0 && x <= source.width && y <= source.height) {
				this.mouseHovered = true;
			}else{
				this.mouseHovered = false;
			}
			
			this.mouseX = x;
			this.mouseY = y;
		}
		
		if(!skip && this.visible) {
			slice.setWH(
				dest.x - source.x - display.x + container.x + containerSlice.x,
				dest.y - source.y - display.y + container.y + containerSlice.y,
				dest.width, dest.height
			);
			
			this.onPaint.fire({"c":ctx, "d":{"dest":dest, "slice":slice, "origin":source}});
			
			if(this.activeBorder !== null && this.active) {
				ctx.strokeStyle = this.activeBorder;
				ctx.strokeRect(dest.x+0.5, dest.y+0.5, slice.width-1, slice.height-1);
			}
			
			if(this.mark) {
				ctx.strokeStyle = this.mark;
				ctx.fillStyle = this.mark;
				ctx.font = "10px sans";
				ctx.lineWidth = 1;
				ctx.fillText(this.name + (this.mouse ? " M" : "") + (this.active ? " A" : ""), dest.x + 1, dest.y + 10);
				ctx.strokeRect(dest.x+0.5, dest.y+0.5, slice.width-1, slice.height-1);
				
				ctx.strokeRect(dest.x + this.mouseX, dest.y+this.mouseY, 1, 1);
				
				//ctx.strokeStyle = "#0000ff";
				//ctx.strokeRect(dest.x+0.5, dest.y+0.5, container.width-1, container.height-1);
			}
		}
		
		if(oldAlpha >= 0) ctx.globalAlpha = oldAlpha;
		
		PosRect.pool.free(source);
		PosRect.pool.free(slice);
		PosRect.pool.free(dest);
	};
	
	/** Draws this component onto the given canvas.
	 * 
	 * This will change settings (such as fill colours and fonts) of the canvas, and not change them back.
	 * 
	 * @param {CanvasRenderingContext2D} ctx The canvas context on which to draw.
	 * @param {x=0} The x coordinate to draw from.
	 * @param {y=0} The y coordinate to draw from.
	 * @param {?width} The width, defaults to the component's width.
	 * @param {?height} The height, defaults to the component's height.
	 * @since 0.0.21-alpha
	 */
	Component.prototype.paint = function(ctx, x, y, width, height) {
		if(x === undefined) x = 0;
		if(y === undefined) y = 0;
		if(width === undefined) width = this.width;
		if(height === undefined) height = this.height;
		
		if(!this.visible || this.alpha <= 0) return;
		
		// Transparency
		var oldAlpha = -1;
		var alpha = this.alpha;
		if(this.alpha != ctx.globalAlpha && this.alpha != 1) {
			oldAlpha = ctx.globalAlpha;
			ctx.globalAlpha *= this.alpha;
		}
		
		// From the component with these dimensions
		var source = PosRect.pool.alloc();
		// Slice this bit out of it
		var slice = PosRect.pool.alloc();
		// And put it here
		var dest = PosRect.pool.alloc();
		
		// Calculate source
		source.setWH(x, y, width, height);
		
		// Then calculate the slice and dest
		dest.setWH(x, y, source.width, source.height);
		slice.setWH(0, 0, dest.width, dest.height);
		
		this.onPaint.fire({"c":ctx, "d":{"dest":dest, "slice":slice, "origin":source}});
		
		if(this.activeBorder !== null && this.active) {
			ctx.strokeStyle = this.activeBorder;
			ctx.strokeRect(dest.x+0.5, dest.y+0.5, slice.width-1, slice.height-1);
		}
		
		if(this.mark) {
			ctx.strokeStyle = this.mark;
			ctx.fillStyle = this.mark;
			ctx.font = "10px sans";
			ctx.fillText(this.name, dest.x + 1, dest.y + 10);
			ctx.strokeRect(dest.x+0.5, dest.y+0.5, slice.width-1, slice.height-1);
		}
		
		if(oldAlpha >= 0) ctx.globalAlpha = oldAlpha;
		
		PosRect.pool.free(source);
		PosRect.pool.free(slice);
		PosRect.pool.free(dest);
	};
	
	/** Alters the layer this is on.
	 *	This calls `{@link dusk.sgui.Group#alterChildLayer}` of its container.
	 * 
	 * This can be set in the JSON representation using the property `"layer"`
	 * 
	 * @param {string} alteration An alteration to make to the layer this component is on.
	 * @since 0.0.17-alpha
	 */
	Component.prototype.alterLayer = function(alteration) {
		if(this.container) {
			this.container.alterChildLayer(this.name, alteration);
		}
	};
	
	
	/** Resolves a path relative to the current component, or null, if it doesn't exist.
	 * 
	 * See `{@link dusk.sgui}` for a description on how paths work.
	 * 
	 * @param {string|array} path The path to resolve.
	 * @return {?dusk.sgui.Component} The component the path is a path to.
	 */
	Component.prototype.path = function(path) {
		if(!path){
			console.warn("Path '"+path+"' is undefined or empty.");
			return null;
		}
		
		if(path.indexOf(":") !== -1) return sgui.path(path);
		
		if(typeof path == "string") {
			path = path.split("/").reverse();
		}
		
		var p = path.pop();
		switch(p) {
			case "..":
				if(path.length) return this.container.path(path);
				return this.container;
			
			case ".":
				return this;
			
			case "":
				if(!path.length) return this;
				if(Root && this instanceof Root) return this.path(path);
				return this.container.path(path);
			
			default:
				if(Group && this instanceof Group){
					if(!path.length) return this.get(p);
					if(this.get(p)) {
						return this.get(p).path(path);
					}else{
						return null;
					}
				}
				
				console.warn(path + " from " + this.name + " was not found.");
				return null;
		}
	};
	
	/** Returns the full path of this component.
	 * 
	 * This should be able to be given to `{@link dusk.sgui.path}` and will point to this component.
	 * @return {string} A full path to this component.
	 * @since 0.0.17-alpha
	 */
	Component.prototype.fullPath = function() {
		return this.container.fullPath() + this.name;
	};
	
	/** Creates or returns elements from inside the dw-paint HTML element that holds the root of this component.
	 * 
	 * If they don't exist, they will be created.
	 * @param {string} tag The tag name of the element to get or create.
	 * @return {array} An array of HTMLElements, one per dw-paint that this component's root is displayed on.
	 * @since 0.0.21-alpha
	 */
	Component.prototype.getHtmlElements = function(tag) {
		return this.container.getHtmlElements(tag);
	};
	
	
	/** Adds the specified extra to this component.
	 * @param {string} type The class name of the extra to add.
	 * @param {string} name The name to give the extra.
	 * @param {object} data Initial properties of the extra.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.addExtra = function(type, name, data) {
		this._extras[name] = new (sgui.getExtra(type))(this, name);
		this._extras[name].update(data);
	};
	
	/** Removes a previously added extra from this component, if it exists.
	 * @param {string} name The name of the extra to remove.
	 * @return {boolean} Whether the extra exists and was removed.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.removeExtra = function(name) {
		if(name in this._extras) {
			this._extras[name].onDelete.fire();
			delete this._extras[name];
			return true;
		}
		
		return false;
	};
	
	/** Modifies an extra, if it exists.
	 * 	If it does not exist, it will be attempted to be created with the type specified by the "type" property
	 *  or it will fail and do nothing with a warning.
	 * @param {string} name The name of the extra to modify.
	 * @param {object} data The data to use to modify.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.updateExtra = function(name, data) {
		if(name in this._extras) {
			this._extras[name].update(data);
		}else if("type" in data) {
			this.addExtra(data.type, name, data);
		}else{
			console.warn("Tried to modify "+name+", but it does not exist and has no type.");
		}
	};
	
	/** Returns the extra with the specified name, or null.
	 * @param {string} name The name of the extra to get.
	 * @return {?dusk.sgui.extras.Extra} The extra.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.getExtra = function(name) {
		if(name in this._extras) return this._extras[name];
		return null;
	};
	
	/** Returns the extra with the specified type or null.
	 * @param {string} type The name of the type of extra to get.
	 * @return {?dusk.sgui.extras.Extra} The first extra found of that type, or null.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.getExtraByType = function(type) {
		for(var p in this._extras) {
			if(this._extras[p] instanceof sgui.getExtra(type)) return this._extras[p];
		}
		
		return null;
	};
	
	/** Returns the extra with the specified type, if it doesn't exist, it checks if the parent has it, and so on.
	 * @param {string} type The name of the type of extra to get.
	 * @return {?dusk.sgui.extras.Extra} The first extra found of that type, or null.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.getExtraByTypeFromParents = function(type) {
		if(this.getExtraByType(type)) return this.getExtraByType(type);
		if(this.container) return this.container.getExtraByTypeFromParents(type);
		return null;
	};
	
	/** Modifies multiple extras. The argument is an object. Keys are the name of the extra to edit/create,
	 * 	and the value is either an object describing properties of the extra, or false to explictly delete the extra.
	 * 
	 * This may be used in the JSON representation with the property "extras".
	 * 
	 * @param {object} data Data to describe the extras, as described above.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.updateMultipleExtras = function(data) {
		for(var p in data) {
			if(data[p]) {
				this.updateExtra(p, data[p]);
			}else{
				this.removeExtra(p);
			}
		}
	};
	
	/** Makes this component the active one, by making all its parents make it active.
	 * @param {?dusk.sgui.Component} child A child that wants to be made active.
	 * @since 0.0.21-alpha
	 */
	Component.prototype.becomeActive = function(child) {
		if("flow" in this && child) this.flow(child.name);
		
		this.container.becomeActive(this);
	};
	
	/** Returns the Root that this component is in.
	 * @return {dusk.sgui.Root} The root.
	 * @since 0.0.21-alpha
	 */
	Component.prototype.getRoot = function() {
		return this.container.getRoot();
	}
	
	/** Returns a string representation of the component. 
	 * 
	 * @return {string} A string representation of this component.
	 */
	Component.prototype.toString = function() {
		return "[sgui "+sgui.getTypeName(this)+" "+this.name+"]";
	};
	
	/** Returns a fancy representation of this element, groups overload this and make it look prettier.
	 * 
	 * @param {array<dusk.sgui.Component>} logarr Arguments to pass to console.log. Append anything to this if needed.
	 * @return {string} A string representation of this component.
	 */
	Component.prototype.describe = function(logarr) {
		var holdstr = "%c "+this.name;
		logarr.push("color:#333333;");
		if(this.active) holdstr += "*";
		if(this.allowMouse && !this.mouseAction) holdstr += "m";
		if(this.allowMouse && this.mouseAction) holdstr += "M";
		logarr.push(this);
		holdstr += " %o";
		return holdstr;
	};
	
	
	//type
	Object.defineProperty(Component.prototype, "type", {
		set: function(value) {
			if(value && value != sgui.getTypeName(this)) {
				this.deleted = true;
				
				var data = this.bundle();
				data.type = value;
				data.deleted = false;
				
				this.container.get(this.name, value).update(data);
				sgui.applyStyles(this.container.get(this.name));
			}
		},
		
		get: function() {
			return sgui.getTypeName(this);
		}
	});
	
	/** Pool of event objects for `{@link dusk.sgui.Component#onPaint}`.
	 * @type dusk.utils.Pool<Object>
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _onPaintPool = new Pool(Object);
	
	return Component;
})());

load.provide("dusk.sgui.NullCom", (function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	
	/** Creates a new NullComponent.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * 
	 * @class dusk.sgui.NullCom
	 * 
	 * @classdesc A NullCom is essentially a "blank component". It is invisible, and does nothing.
	 * @extends dusk.sgui.Component
	 */
	var NullCom = function(parent, name) {
		Component.call(this, parent, name);
		this.visible = false;
	};
	NullCom.prototype = Object.create(Component.prototype);
	
	/** A NullComponent bundles up as an empty object.
	 * 
	 * @return {object} An empty object.
	 * @since 0.0.19-alpha
	 */
	NullCom.prototype.bundle = function() {return {};}
	
	sgui.registerType("NullCom", NullCom);
	
	return NullCom;
})());
