//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("saving", (function() {
	window.save = load.require("dusk.save");
	window.SS = load.require("dusk.save.SaveSpec");
	window.lss = load.require("dusk.save.LocalStorageSource");
	window.cs = load.require("dusk.save.ConsoleSource");
	window.st = load.require("dusk.save.SaveTest");
	window.sti = load.require("dusk.save.SaveTestInstance");
	
	window.ss = new SS("saving_test", "Saving Test");
})());
