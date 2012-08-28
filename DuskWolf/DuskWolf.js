//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk");

/** @namespace dusk
 * 
 * @description This is the "root" object for DuskWolf, and provides a few functions and configuration thingies.
 * 
 * The DuskWolf engine is created by SavageWolf (Ross Brunton) who can be contacted by email at savagewolf8@gmail.com if you so desire.
 * 
 * You could read readme.md for more information about the engine, but I doubt you'd be able to figure out that you can open it in a text editor.
 * 
 * My naming standard of things are as follows:
 * 
 * - CapitalLetters denotes a class.
 * 
 * - camelCase denotes a public property of an object.
 * 
 * - \_\_doubleUnderscore\_\_ denotes a configuration var.
 * 
 * - \_singleUnderscore denotes ether a private or protected function.
 */

/** Version of the DW engine. Must contain at least one number, and numbers furthest to the left indicate newer versions.
 * @type number */
dusk.ver = "0.0.12-alpha";

/** The frame rate, in frames per second. 
 * @type number */
dusk.frameRate = ("__frameRate__" in window)?__frameRate__:60;

/** The path to the data directory, this is where the game will look for all it's assets if given a relative URL. 
 * @type string */
dusk.dataDir = ("__dataDir__" in window)?__dataDir__:"Data";

/** If true, then instead of the file root.json being used as the root.json file, the HTTP get var `dw_root` in the page URL is used, if it exists.
 * @type boolean 
 * @since 0.0.12-alpha */
dusk.overrideRoot = ("__overrideRoot__" in window)?__overrideRoot__:false;

/** The name of the HTML canvas object SimpleGui uses.
 * @type string
 * @see dusk.mods.simpleGui */
dusk.canvas = ("__canvas__" in window)?__canvas__:"canvas";

/** If true, then some features for developers are added, such as no caching for scripts and FPS info.
 * @type boolean */
dusk.dev = ("__development__" in window)?__development__:true;
