//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.require("dusk.utils");

load.provide("dusk.save", (function() {
	var utils = load.require("dusk.utils");
	var dusk = load.require("dusk");
	
	/** @namespace dusk.save
	 * @name dusk.save
	 * 
	 * @description Provides an interface for saving game data to various sources.
	 * 
	 * The saving system has three main parts, the interface `{@link dusk.save.ISavable}` should be implemented by
	 *  namespaces that wish to be saved and loaded. Instances of `{@link dusk.save.SaveSpec}` are used to list what exactly
	 *  should be saved. Lastly, `{@link dusk.save.SaveSource}` instances describe a location to save or
	 *  load from, such as local storage or cloud based systems.
	 * 
	 * For objects that do not have a static location, it gets more complicated. Generally, they are saved in a long list
	 *  of "references", which contain an object representation of the object, and the class used to construct it. If you
	 *  want to save an object which isn't simple (i.e. has a prototype), then, providing it implements
	 *  `{@link dusk.save.IRefSavable}` you can call `{@link dusk.save.saveRef}` and `{@link dusk.loadRef}` with it.
	 * 
	 * Likewise, if you wish to create a class which can be saved, it should implement both `{@link dusk.save.IRefSavable}`
	 *  `{@link dusk.save.IRefSavableInstance}`.
	 * 
	 * @since 0.0.21-alpha
	 */
	var save = {};

	/** Array storing the original objects for refs, so any new references can check if they already exist.
	 * @type array
	 * @private
	 */
	var _refOrigins = [];
	/** Reference array, the reference id is the key in this array, and this is emptied when saving starts, and set 
	 *  when loading starts with the previous data.
	 * @type array
	 * @private
	 */
	var _refs = [];
	/** The loaded reference objects. Emptied when loading starts, then slowly filled up with the refered objects as
	 *  needed. Keys correspond to reference IDs.
	 * @type array
	 * @private
	 */
	var _refsLoaded = [];

	/** Saves data from the specified spec into the specified source.
	 * @param {dusk.save.SaveSpec} spec The specification of what to save.
	 * @param {dusk.save.SaveSource} source The source to save to.
	 * @param {string} identifier The identifier at which to save the file.
	 * @return {Promise(boolean)} A promise that fullfills the constant true, or rejects if the save failed.
	 */
	save.save = function(spec, source, identifier) {
		var saveData = spec.save();
		return source.save(saveData, spec, identifier);
	};

	/** Loads data from a specified spec and source.
	 * @param {dusk.save.SaveSpec} spec The specification to use when loading.
	 * @param {dusk.save.SaveSource} source The source to load from.
	 * @param {string} identifier An identifier of what you want to load.
	 * @return {Promise(boolean)} A promise that fullfills the constant true, or rejects if load fails.
	 */
	save.load = function(spec, source, identifier) {
		return new Promise(function(fullfill, reject) {
			return source.load(spec, identifier).then(function(saveData) {
				if(saveData) {
					spec.load(saveData);
					fullfill(true);
				}
			});
		});
	};

	/** Saves a reference to the object. If the object already exists, a previously used reference will be returned.
	 *  References can be generated for any object, they don't have to implement any particular interface.
	 * 
	 * `{@link dusk.save.loadRef}` must be used to load the reference back again.
	 * @param {*} obj The object to generate a reference for.
	 * @return {integer|array} An integer or `[id, class]` pair for the reference.
	 */
	save.saveRef = function(obj) {
		if(typeof obj != "object" || obj === null) return obj;
		
		var imps = utils.doesImplement(obj, save.IRefSavableInstance);
		
		for(var i = 0; i < _refOrigins.length; i ++) {
			if(_refOrigins[i] == obj) {
				if(imps) {
					return [i, obj.refClass()];
				}else{
					return i;
				}
			}
		}
		
		if(imps) {
			_refs.push(obj.refSave());
			return [_refs.length-1, obj.refClass()];
		}else{
			_refs.push(obj);
			return _refs.length-1;
		}
	};

	/** Loads a previously saved reference. References are generated by `{@link dusk.save.saveRef}`.
	 * @param {integer|array} An id or `[id, class]` pair for loading.
	 * @return {*} The object that was referred to.
	 */
	save.loadRef = function(ref) {
		if((typeof ref != "number" && !Array.isArray(ref))|| ref === null) return ref;
		
		if(typeof ref == "number") {
			if(_refsLoaded[ref]) return _refsLoaded[ref];
			if(ref >= _refs.length) throw new save.SaveIntegrityError();
			
			_refsLoaded[ref] = _refs[ref];
			return _refsLoaded[ref];
		}else if(Array.isArray(ref) && ref.length == 2) {
			if(_refsLoaded[ref[0]]) return _refsLoaded[ref[0]];
			if(ref[0] >= _refs.length) throw new save.SaveIntegrityError();
			
			var frags = ref[1].split(".");
			var p = 0;
			var o = window;
			while(p < frags.length) {
				o = o[frags[p]];
				p ++;
			}
			
			if(!utils.doesImplement(o, save.IRefSavable)) throw new save.SaveIntegrityError();
			_refsLoaded[ref[0]] = o.refLoad(_refs[ref[0]]);
			return _refsLoaded[ref[0]];
		}else{
			throw new save.SaveIntegrityError();
		}
	};


	/** Creates a new save spec.
	 * 
	 * @class dusk.save.SaveSpec
	 * 
	 * @classdesc Specifies what to save.
	 * 
	 * Generally, a save spec is a list of classes to save, what data those classes have to save and any arguments to give
	 *  to the saving function.
	 * 
	 * New things to save are added to the saving specification via `{@link dusk.save.SaveSpec#add}`.
	 * 
	 * @param {string} name A name for the specification.
	 * @param {?string} prettyName A pretty name (for displaying to the user) of this specification. If omited, this will be
	 *  the same as `name`.
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.SaveSpec = function(name, prettyName) {
		/** Name of the save specification.
		 * @type string
		 */
		this.name = name;
		/** Pretty name of the save specification.
		 * @type string
		 */
		this.prettyName = prettyName?prettyName:name;
		
		/** Array of all the things that will be saved by this spec.
		 * 
		 * Each entry is an array in the form `[path, type, args]`.
		 * @type array
		 * @private
		 */
		this._toSave = [];
	};

	/** Adds a new namespace or class that will be saved when this specification saves.
	 * 
	 * The path must be a string, and is the path from the `window` object to the thing that is to be saved. The thing to
	 *  be saved must implement `{@link dusk.save.ISavable}`.
	 * 
	 * @param {string} path The path to the object to save.
	 * @param {string} type The type of thing to save, passed to the save function of the object.
	 * @param {?*} args Arguments to the save function, passed to the save function of the object.
	 */
	save.SaveSpec.prototype.add = function(path, type, args) {
		this._toSave.push([path, type, args]);
	};

	/** Saves the data represented by this save spec.
	 * 
	 * This same data can be called using `{@link dusk.save.SaveSpec#load}` to restore the state that this was called in.
	 * 
	 * @return {dusk.save.SaveData} The data that was saved.
	 */
	save.SaveSpec.prototype.save = function() {
		var saveData = new save.SaveData(this);
		_refs = [];
		_refOrigins = [];
		
		for(var i = this._toSave.length-1; i >= 0; i --) {
			var ob = utils.lookup(window, this._toSave[i][0]);
			if(ob) {
				if(saveData.data[this._toSave[i][0]] === undefined) {
					saveData.data[this._toSave[i][0]] = [];
				}
				
				saveData.data[this._toSave[i][0]].push(
					[this._toSave[i][1], this._toSave[i][2], ob.save(this._toSave[i][1], this._toSave[i][2])]
				);
			}else{
				console.error("Tried to save from "+this._toSave[i][0]+", but it doesn't exist!");
			}
		}
		
		saveData.meta().refs = utils.clone(_refs);
		
		return saveData;
	};

	/** Loads the data represented by this save spec.
	 * 
	 * This accepts saveData and calls all the load functions of all the relevent things with the same arguments that were
	 *  used to save them.
	 * 
	 * @param {dusk.save.SaveData} saveData The data to load from.
	 */
	save.SaveSpec.prototype.load = function(saveData) {
		this._refs = saveData.meta().refs;
		this._refsLoaded = [];
		
		for(var p in saveData.data) {
			if(p != "meta") {
				var ob = utils.lookup(window, p);
				if(ob) {
					if(!Array.isArray(saveData.data[p])) throw new save.SaveIntegrityError();
					for(var i = saveData.data[p].length -1; i >= 0; i --) {
						if(!Array.isArray(saveData.data[p][i]) || saveData.data[p][i].length != 3)
							throw new save.SaveIntegrityError();
						ob.load(saveData.data[p][i][2], saveData.data[p][i][0], saveData.data[p][i][1]);
					}
				}else{
					console.error("Tried to load into "+this._toSave[i][0]+", but it doesn't exist!");
					throw new save.SaveIntegrityError();
				}
			}
		}
	};

	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	save.SaveSpec.prototype.toString = function() {
		return "[SaveSpec "+name+"]";
	};

	Object.seal(save.SaveSpec);


	/** Creates a new save source, which is unable to save and load.
	 * 
	 * @class dusk.save.SaveSource
	 * 
	 * @classdesc Base class for objects that wish to save and load save data from a specific source.
	 * 
	 * Inheriters must replace the `save` and `load` functions with their own versions, and not call the versions on this
	 *  class.
	 * 
	 * SaveSources can "support" identifiers or not. Generally, if identifiers are supported then attempting to load with
	 *  identifier `n` will always load the last save data that was saved using identifier `n`. If they are not supported,
	 *  then identifiers may be provided to give a hint to what the data should be saved as.
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.SaveSource = function() {
		
	};

	/** Given a save data, saves it to this source.
	 * 
	 * @param {dusk.save.SaveData} saveData The save data to save.
	 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
	 * @param {?string} identifier An identifier for saving.
	 * @return {Promise(boolean)} A promise that fullfills with the value true when saving is complete.
	 */
	save.SaveSource.prototype.save = function(saveData, spec, identifier) {
		console.warn("Save Source "+this+" doesn't support saving.");
		return Promise.reject(Error("Save Source "+this+" doesn't support saving."));
	};

	/** Similar to `{@link dusk.save.SaveSource#save}`, only this is called in cases where saving should be done without
	 *  interrupting the user. By default, this calls the normal save function.
	 * 
	 * @param {dusk.save.SaveData} saveData The save data to save.
	 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
	 * @param {?string} identifier An identifier for saving.
	 * @return {Promise(boolean)} A promise that fullfills with the value true when saving is complete.
	 */
	save.SaveSource.prototype.autoSave = function(saveData, spec, identifier) {
		return this.save(saveData, spec, identifier);
	};

	/** Loads save data from this source.
	 * 
	 * @param {dusk.save.SaveSpec} spec The spec to be used to load this data.
	 * @param {?string} identifier An identifier for loading from.
	 * @return {Promise(dusk.save.SaveData)} A promise that fullfills with the save data when it has been loaded.
	 */
	save.SaveSource.prototype.load = function(spec, identifier) {
		console.warn("Save Source "+this+" doesn't support loading.");
		return Promise.reject(Error("Save Source "+this+" doesn't support loading."));
	};

	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	save.SaveSource.prototype.toString = function() {
		return "[SaveSource]";
	};

	/** True if this source supports identifiers, as in, loading and saving with the same identifiers load and save the same
	 *  data. This is on the prototye of the source.
	 * 
	 * @type boolean
	 * @default true
	 * @static
	 */
	save.SaveSource.prototype.identifierSupport = true;

	Object.seal(save.SaveSource);


	/** Creates a new save data object.
	 * 
	 * @class dusk.save.SaveSource
	 * 
	 * @classdesc Represents save data. Either data loaded or data that has been saved.
	 * 
	 * It contains a `{@link dusk.save.SaveData#data}` property, which is the object that should be saved and loaded. The 
	 *  keys of this object are the class or namespace name of the thing that saved them, and the value contains both the
	 *  actual data and parameters. The `data` object is the object that should actually be saved and loaded.
	 * 
	 * A `meta` property is available on the data, and also via the `{@link dusk.save.SaveData#meta}` method. This is an
	 *  object containing the following values:
	 * 
	 * - `saved`: The date on which the data was saved or loaded.
	 * - `name`: The name of the specification that saved this data.
	 * - `ver`: The version of DuskWolf that saved the data.
	 * 
	 * The constructor accepts initial data, which should almost always be data that was loaded from the source.
	 *  This can be either a string or an object. If it is an object, the `data` property is set to it. If it is a string,
	 *  it is parsed as if it was created by `{@link dusk.save.SaveData#toDataUrl}`, and then set to `data`.
	 * 
	 * @param {dusk.save.SaveSpec} spec The specification thihs data is using.
	 * @param {?object | string} initial Any initial data that this save data should use.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.SaveData = function(spec, initial) {
		/** The spec that this data is using.
		 * @type {dusk.save.SaveSpec}
		 */
		this.spec = spec;
		
		if(typeof initial == "string") {
			try{
				initial = JSON.parse(atob(initial));
			}catch(e){
				throw new save.SaveIntegrityError();
			}
		}
		
		/** The actual save data, as a basic, simple, object.
		 * @type {object}
		 */
		this.data = initial?initial:{};
		
		if(!initial) {
			this.data.meta = {};
			this.data.meta.saved = new Date();
			this.data.meta.spec = spec.name;
			this.data.meta.ver = dusk.ver;
			this.data.meta.refs = dusk.save._refs;
		}else if(!("meta" in this.data)) {
			throw new save.SaveIntegrityError();
		}
	};

	/** Returns the meta object of this save data.
	 * @return {object} The meta property of the save data.
	 */
	save.SaveData.prototype.meta = function() {
		return this.data.meta;
	};

	/** Converts the save data to a data URL.
	 * @return {string} The save data.
	 */
	save.SaveData.prototype.toDataUrl = function() {
		return "data:application/json;base64,"+btoa(JSON.stringify(this.data));
	};

	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	save.SaveData.prototype.toString = function() {
		return "[SaveData "+this.spec.name+"]";
	};

	Object.seal(save.SaveData);


	/** @class dusk.save.ISavable
	 * 
	 * @classdesc Objects implementing this interface will be able to load and save data.
	 *
	 * An interface; it is expected all subclasses of this supply the methods on this class.
	 * 
	 * Generally, objects have a certain number of features that can be saved; the "type" of thing. Loading the same data 
	 *  that was saved previously should restore what was saved to the state it was when it was saved.
	 * 
	 * Basically, `{@link dusk.save.ISavable#load}({@link dusk.save.ISavable#save}("x"), "x")` should not change anything.
	 * 
	 * List of methods required:
	 * 
	 * - {@link dusk.save.ISavable#save}
	 * - {@link dusk.save.ISavable#load}
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.ISavable = {};

	/** Should save data of the specified type, and return what was saved.
	 * 
	 * @param {string} type The type of thing to save, will be supplied to the load function.
	 * @param {?*} args Any extra data required to save. This is set when this is added to the scheme, and is also sent to
	 *  the load function.
	 * @return {object} The data that was saved. When it's time to load, this object will be the one loaded. Must be a
	 *  simple object (no prototypes).
	 */
	save.ISavable.save = function(type, args) {};
	/** Should load previously saved data of the specified type.
	 * 
	 * @param {object} data The data that was previously saved.
	 * @param {string} type The type of thing to load.
	 * @param {?*} args The arguments to load, this will be the same as the `args` parameter used in the saving function.
	 */
	save.ISavable.load = function(data, type, args) {};

	if("tcheckIgnore" in window) window.tcheckIgnore("dusk.save.ISavable");

	Object.seal(save.ISavable);


	/** @class dusk.save.IRefSavable
	 * 
	 * @classdesc Implementers of this interface must be able to load a previously saved instance of this class, restoring
	 *  its state.
	 * 
	 * The difference between this and `{@link dusk.save.ISavable}` is that with this class, instances are saved, rather
	 *  than namespaces.
	 * 
	 * Properties of this namespace must be on the constructor of the function, and instances must implement
	 *  `{@link dusk.savabale.IRefSavableInstance}`.
	 * 
	 * List of methods required:
	 * 
	 * - {@link dusk.save.IRefSavable#refLoad}
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.IRefSavable = {};

	/** Should load previously saved data of the specified type.
	 * 
	 * The data comes from `{@link dusk.save.IRefSavableInstance#refSave}`, and loading should create an equivalent object.
	 * 
	 * @param {*} data The data that was previously saved.
	 */
	save.IRefSavable.refLoad = function(data) {};

	if("tcheckIgnore" in window) window.tcheckIgnore("dusk.save.IRefSavable");

	Object.seal(save.IRefSavable);


	/** @class dusk.save.IRefSavableInstance
	 * 
	 * @classdesc Implementers of this interface must be able to save themselves to be loaded later.
	 * 
	 * The difference between this and `{@link dusk.save.ISavable}` is that with this class, instances are saved, rather
	 *  than namespaces.
	 * 
	 * Properties of this namespace must be on instances of the object to be saved, and the constructor must implement
	 *  `{@link dusk.savabale.IRefSavable}`.
	 * 
	 * List of methods required:
	 * 
	 * - {@link dusk.save.IRefSavableInstance#refSave}
	 * - {@link dusk.save.IRefSavableInstance#refClass}
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.IRefSavableInstance = {};

	/** Should save this object such that it can be loaded via `{@link dusk.save.IRefSavable#refLoad}` of its constructor.
	 * 
	 * @return {*} A representation of this object. Must be a simple object (no prototypes).
	 */
	save.IRefSavableInstance.refSave = function() {};

	/** Should return the path (from window) of this object's constructor. This object must implement
	 *  `{@link dusk.save.IRefSavable}`. This will be used to load this object.
	 * 
	 * @return {string} Path to this object's constructor.
	 */
	save.IRefSavableInstance.refClass = function() {};

	if("tcheckIgnore" in window) window.tcheckIgnore("dusk.save.IRefSavableInstance");

	Object.seal(save.IRefSavableInstance);

	/** @class dusk.save.SaveIntegrityError
	 * 
	 * @classdesc Exception representing that save data is invalid or corrupt.
	 * 
	 * @extends Error
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.SaveIntegrityError = function(parent, comName) {
		Error.call(this);
		
		this.name = "SaveIntegrityError";
		this.message = "The save data is corrupt";
	};
	save.SaveIntegrityError.prototype = Object.create(Error.prototype);
	
	Object.seal(save.SaveIntegrityError);
	Object.seal(save.SaveIntegrityError.prototype);
	
	Object.seal(save);
	
	return save;
})());
