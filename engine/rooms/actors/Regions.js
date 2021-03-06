//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.actors.Regions", function() {
	var Runner = load.require("dusk.script.Runner");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var Region = load.require("dusk.tiles.Region");
	var utils = load.require("dusk.utils");
	var RegionDisplay = load.require("dusk.tiles.sgui.RegionDisplay");
	
	/** TODO: Document
	 * 
	 * @since 0.0.21-alpha
	 * @memberof dusk.rooms.actors
	 */
	class RegionActor {
		/** Creates a new RegionActor
		 * 
		 * @param {dusk.rooms.sgui.LayeredRoom} layeredRoom The layered room to act upon.
		 * @param {?string} path The path to the region layer to use. If it is null, the first layer found of the
		 *  correct type will be used.
		 */
		constructor(layeredRoom, path) {
			this.layeredRoom = layeredRoom;
			this.path = path;
		}
		
		getDisplay() {
			if(!this.path) {
				return this.layeredRoom.getFirstLayerOfType(LayeredRoom.LAYER_REGION);
			}else{
				return this.layeredRoom.get(this.path);
			}
		}
		
		generate(expand, options) {
			return Runner.action("dusk.rooms.actors.Regions.generate", (function(x, add) {
				var region = new Region(this.getDisplay().cols, this.getDisplay().rows, 1);
				
				if(options.dest) {
					x[options.dest] = region;
				}else{
					x.region = region;
				}
				
				var arg = utils.copy(expand);
				
				if(options.copy) {
					for(var c of options.copy) {
						arg[c[1]] = x[c[0]];
					}
				};
				
				region.expand(arg);
				return x;
			}).bind(this));
		}
		
		display(name, colour, options) {
			return Runner.action("dusk.rooms.actors.Regions.display", (function(x, add) {
				var region;
				
				if(options.which) {
					region = x[options.dest];
				}else{
					region = x.region;
				}
				
				var cValue = colour.startsWith("*") ? x[colour.substring(1)] : colour;
				var nValue = name.startsWith("*") ? x[name.substring(1)] : name;
				var sValue = "";
				if("sub" in options) sValue = options.sub.startsWith("*") ? x[options.sub.substring(1)] : options.sub;
				
				if(sValue) {
					this.getDisplay().display(nValue, RegionDisplay.MODE_SUBREGION, cValue, options, region, sValue);
				}else{
					this.getDisplay().display(nValue, RegionDisplay.MODE_REGION, cValue, options, region);
				}
				
				return x;
			}).bind(this),
			
			(function(x) {
				var nValue = name.startsWith("*") ? x[name.substring(1)] : name;
				this.getDisplay().unDisplay(nValue);
				
				return Promise.reject(new Runner.Cancel());
			}).bind(this));
		}
		
		makePath(options) {
			return Runner.action("dusk.rooms.actors.Regions.makePath", (function(x, add) {
				var region;
				
				if(options.which) {
					region = x[options.dest];
				}else{
					region = x.region;
				}
				
				x.path = region.emptyPath(!options.noClamp);
				
				return x;
			}).bind(this));
		}
		
		displayPath(name, image, options) {
			return Runner.action("dusk.rooms.actors.Regions.displayPath", (function(x, add) {
				var region;
				
				if(options.which) {
					region = x[options.dest];
				}else{
					region = x.path;
				}
				
				var iValue = image.startsWith("*") ? x[image.substring(1)] : image;
				var nValue = name.startsWith("*") ? x[name.substring(1)] : name;
				var sValue = "";
				
				this.getDisplay().display(nValue, RegionDisplay.MODE_PATH, iValue, options, region);
				
				return x;
			}).bind(this),
			
			(function(x) {
				var nValue = name.startsWith("*") ? x[name.substring(1)] : name;
				this.getDisplay().unDisplay(nValue);
				
				return Promise.reject(new Runner.Cancel());
			}).bind(this));
		}
		
		unDisplay(regions, options) {
			return Runner.action("dusk.rooms.actors.Regions.unDisplay", (function(x, add) {
				x.removedRegions = regions.map((function(name) {return this.getDisplay().getDisplay(name);}).bind(this));
				var region;
				
				for(var r of regions) {
					this.getDisplay().unDisplay(r);
				}
				
				return x;
			}).bind(this),
			
			(function(x) {
				for(var r of x.removedRegions) {
					this.getDisplay().display.apply(this.getDisplay(), r);
				}
				
				return Promise.reject(new Runner.Cancel());
			}).bind(this));
		}
		
		getSubRegion(name, options) {
			return Runner.action("dusk.rooms.actors.Regions.getSubRegion", (function(x, add) {
				var region;
				
				if(options.from) {
					region = x[options.from];
				}else{
					region = x.region;
				}
				
				var to = options.to ? options.to : "region";
				
				var nValue = name.startsWith("*") ? x[name.substring(1)] : name;
				
				x[to] = region.getChild(x.x, x.y, 0, nValue);
				
				return x;
			}).bind(this));
		}
	}
	
	return RegionActor;
});
