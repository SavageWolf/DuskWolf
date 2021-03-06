//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.SelectorManager", function() {
	var utils = load.require("dusk.utils");
	var EntityGroup = load.require("dusk.entities.sgui.EntityGroup");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var entities = load.require("dusk.entities");
	var dirs = load.require("dusk.utils.dirs");
	var frameTicker = load.require("dusk.utils.frameTicker");
	var controls = load.require("dusk.input.controls");
	var mouse = load.require("dusk.input.mouse");
	var at = load.require("dusk.tiles.sgui.extras.animationTypes");
	
	class SelectorManager {
		constructor(com, type) {
			this._com = com;
			this._select = null;
			this._hidden = false;
			this._oldVis = true;
			
			this._oldX = -1;
			this._oldY = -1;
			
			this._taskRunning = false;
			
			this._path = null;
			
			frameTicker.onFrame.listen(this._onFrame.bind(this));
			
			this._endMoveHandlers = [];
			
			this.selectorType = type ? type : "stdSelector";
		}
		
		getSelector() {
			if(this._select && !this._select.deleted) {
				return this._select;
			}else{
				if(this._com instanceof EntityGroup) {
					this._select = this._com.dropEntity({"name":"_selector", "type":this.selectorType, "x":0, "y":0});
				}else if(this._com instanceof LayeredRoom) {
					this._select = this._com.getPrimaryEntityLayer().dropEntity(
						{"name":"_selector", "type":this.selectorType, "x":0, "y":0}
					);
				}else{
					return null;
				}
				this._oldVis = this._select.visible;
				this._select.entityEvent.listen(this._handleEndMove.bind(this), "gwStopMove");
				return this.getSelector();
			}
		}
		
		hide() {
			if(!this._hidden) {
				this._hidden = true;
				this._oldVis = this.getSelector().visible;
				this.getSelector().visible = false;
			}
		}
		
		show() {
			if(this._hidden) {
				this._hidden = false;
				this.getSelector().visible = this._oldVis;
			}
		}
		
		begin() {
			this.show();
			this.getSelector().eProp("gmMouseMove", true);
			this.getSelector().getRoot().pushActive();
			this.getSelector().becomeActive();
		}
		
		done() {
			this.hide();
			this.getSelector().eProp("gmMouseMove", false);
			this.getSelector().getRoot().popActive();
		}
		
		performTask(options) {
			return new Promise((function(fulfillFn, rejectFn) {
				var scope = {};
				
				scope.options = options;
				scope.x = -1;
				scope.y = -1;
				scope.selector = this.getSelector.bind(this);
				
				scope.fulfill = (function(x) {
					this.done();
					this._taskRunning = false;
					this._endMoveHandlers.splice(p, 1);
					controls.controlPressed.unlisten(controlListener);
					mouse.onClick.unlisten(clickListener);
					fulfillFn(x);
				}).bind(this);
				
				scope.reject = (function(x) {
					this.done();
					this._taskRunning = false;
					this._endMoveHandlers.splice(p, 1);
					controls.controlPressed.unlisten(controlListener);
					mouse.onClick.unlisten(controlListener);
					rejectFn(x);
				}).bind(this);
				
				var controlListener = controls.controlPressed.listen(this._control.bind(scope));
				var clickListener = mouse.onClick.listen(this._click.bind(scope));
				var p = this._endMoveHandlers.push(this._innerEndMove.bind(scope)) - 1;
				
				this._taskRunning = true;
				
				if(options.path) {
					scope.path = options.path;
				}else{
					scope.path = null;
				}
				
				this.begin();
			}).bind(this));
		}
		
		_onFrame(e) {
			if(this._taskRunning) {
				this.getSelector();
				if(!this.getSelector().focused) {
					this.getSelector().container.flow(this.getSelector().name);
				}
			
				if(!this.getSelector().eProp("gmMouseMove")) {
					this.getSelector().eProp("gmMouseMove", true);
				}
			}
		}
		
		_control(e) {
			if(this.options.controlHandlers) {
				if(this.options.controlHandlers[e.control]) {
					this.options.controlHandlers[e.control](this, this.options);
				}
			}
		}
		
		_click(e) {
			if(this.options.clickHandlers) {
				if(this.options.clickHandlers[""+e.which]) {
					this.options.clickHandlers[""+e.which](this, this.options);
				}
			}
		}
		
		_handleEndMove(e) {
			for(var h of this._endMoveHandlers) {
				h(e);
			}
		}
		
		_innerEndMove(e) {
			if(e.targetX != this.x || e.targetY != this.y) {
				this.x = e.targetX;
				this.y = e.targetY;
				
				if(this.path) {
					if(e.dir == dirs.NONE) {
						this.path.find(e.targetX, e.targetY, 0);
					}else{
						this.path.append(e.dir);
						if(!this.path.validPath) {
							this.path.find(e.targetX, e.targetY, 0);
						}
					}
				}
				
				if(this.options.onMove) {
					this.options.onMove(this, this.options);
				}
			}
		}
	}
	
	SelectorManager.stdSelect = entities.types.createNewType("stdSelector", {
		"behaviours":{
			"PlayerGridWalker":true, "GridWalker":true, "GridMouse":true 
		},
		"data":{
			"solid":false, "collides":false, "src":"default/selector32.png tiles:32x32", "noSave":true, "noRegion":true,
			"gmMouseMove":false
		},
		"animation":[
			["default", [
				at.setTile(0,0), at.setTile(1,0), at.setTile(2,0), at.setTile(1,0)
			], {"trigger":function(){return true}}]
		]
	}, "quest");
	
	return SelectorManager;
});
