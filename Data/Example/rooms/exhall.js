"use strict";

load.provide("example.plat.rooms.exhall", (function() {
	var manager = load.require("dusk.plat");
	load.require("dusk.entities");
	
	var room = [{"rows":15,"cols":24,"src":"pimg/techB.png","ani":[["1,0","2,0","3,0","2,0"],["4,0","5,0","6,0","5,0"]],"map":"BC16:0x:d002010000006c800400fb80"},{"rows":15,"cols":24,"src":"pimg/schematics.png","ani":[],"map":"BC16:0x:d0020200000001001d800e81098001000e80010004800481108005810401040112800101010101000100040104011280010101010581078000010880088103800a810380088106800481068008811080058103010301128002010201010001000301030107800481078002010201058103800a810380048103800581088005811b80"},[{"name":"#11","type":"coin","x":448,"y":96},{"name":"#10","type":"coin","x":416,"y":96},{"name":"#9","type":"coin","x":288,"y":96},{"name":"#8","type":"coin","x":384,"y":96},{"name":"#7","type":"coin","x":352,"y":96},{"name":"#6","type":"coin","x":320,"y":96},{"name":"#0","type":"fall","x":128,"y":224},{"name":"#1","type":"fall","x":160,"y":224},{"name":"#2","type":"fall","x":192,"y":224},{"name":"#3","type":"fall","x":608,"y":224},{"name":"#4","type":"fall","x":544,"y":224},{"name":"#5","type":"fall","x":576,"y":224},{"name":"nexttoright","type":"fall","x":512,"y":192},{"name":"nexttoleft","type":"fall","x":224,"y":192}],{},{"rows":15,"cols":24,"src":"pimg/techO.png","ani":[],"map":"BC16:0x:d002030001000000020035800e810980108105800382108103820100010003821081038205801081088003810a80000000000001088006810480068108800681048206810580038206810482068103820100010003820681048006810382058003820a8003823480"},{"out":[[".entType=player",1,false,{"package":"example.plat.rooms.rooma","room":"rooma","mark":0}],[".entType=player",2,false,{"package":"example.plat.rooms.roomb","room":"roomb","mark":0}],[".entType=player",3,false,{"package":"example.plat.rooms.roomc","room":"roomc","mark":0}],[".entType=player",4,false,{"package":"example.plat.rooms.roomd","room":"roomd","mark":0}]],"in":{}}];
	
	manager.rooms.createRoom("example.plat.rooms.exhall", room);
	
	//Remember to add extra code!
	return room;
})()); 
