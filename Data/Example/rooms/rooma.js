"use strict";

load.provide("example.plat.rooms.rooma", (function() {
	var manager = load.require("dusk.plat");
	load.require("dusk.entities");
	
	var room = [{"rows":26,"cols":43,"src":"pimg/techB.png","ani":[["4,0","5,0","6,0","5,0"],["1,0","2,0","3,0","2,0"]],"map":"BC16:0x:bc0801000000ff80ff808c800100ff80d480"},{"rows":26,"cols":43,"src":"pimg/schematics.png","ani":[],"map":"BC16:0x:bc080200000001008480258106800100238001000680010023800100068001002380010006800100238001000680010023800100068001000380048100000000038103800381038003810380038100000000010000000000010006800100038004811980010001000000010006800100038004811c80010006800100038004811c80010006800100038001010101010001001a80038106800100038001010101010001001b800100010006800100038004811c800100068005811680058104800100068003811a800100068001000680010000010001118005810b800100068001000001000109800581058001000d8001000680088106800100158001000e8001001b8001000f8001001a80010010801b815980"},[{"name":"#26","type":"coin","x":192,"y":480},{"name":"#25","type":"coin","x":192,"y":448},{"name":"#24","type":"coin","x":160,"y":448},{"name":"#23","type":"coin","x":128,"y":448},{"name":"#22","type":"coin","x":128,"y":480},{"name":"#21","type":"coin","x":416,"y":192},{"name":"#20","type":"coin","x":448,"y":192},{"name":"#19","type":"coin","x":480,"y":192},{"name":"#18","type":"coin","x":608,"y":192},{"name":"#17","type":"coin","x":640,"y":192},{"name":"#16","type":"coin","x":672,"y":192},{"name":"#15","type":"coin","x":800,"y":192},{"name":"#14","type":"coin","x":832,"y":192},{"name":"#13","type":"coin","x":864,"y":192},{"name":"#12","type":"coin","x":992,"y":192},{"name":"#11","type":"coin","x":1024,"y":192},{"name":"#10","type":"coin","x":1056,"y":192},{"name":"#9","type":"coin","x":1056,"y":448},{"name":"#8","type":"coin","x":1024,"y":448},{"name":"#7","type":"coin","x":992,"y":448},{"name":"#6","type":"coin","x":832,"y":512},{"name":"#5","type":"coin","x":800,"y":512},{"name":"#4","type":"coin","x":768,"y":512},{"name":"#3","type":"coin","x":576,"y":544},{"name":"#2","type":"coin","x":544,"y":544},{"name":"#1","type":"coin","x":512,"y":544}],{},{"rows":26,"cols":43,"src":"pimg/techO.png","ani":[],"map":"BC16:0x:bc0804000100000002000300b0802381088023810880238108802381088023810880038204800300030003800383038003830380038303800300030001000000000008800381048019810100010002000880038104801c810880038104801c810880038102000200010001001a810a80038102000200010001001b810980038104801c810c801681058004810a801a8101000681088002000200118105800b8108800200020009810580058101000d810f8006810100158110801b8111801a818580"},{"out":[[".entType=player",0,false,{"package":"example.plat.rooms.exhall","room":"exhall","mark":1}],[".entType=player",1,false,{"package":"example.plat.rooms.exhall","mark":0}]]}];
	
	manager.rooms.createRoom("example.plat.rooms.rooma", room);
	
	//Remember to add extra code!
	return room;
})()); 
