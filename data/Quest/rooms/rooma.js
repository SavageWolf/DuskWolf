// Code generated by RoomManager from DuskWolf 0.0.21-alpha for room quest.rooms.rooma
"use strict";

load.provide("quest.rooms.rooma", (function() {
	var manager = load.require("dusk.rooms.quest").rooms;
	load.require("dusk.entities");
	load.require("quest.ents");
	
	var room = {"rows":25,"cols":24,"contents":[{"rows":25,"cols":24,"src":"Quest/map.png tiles:32x32","ani":[],"map":"BC16:0x:b004010001004b8000010f80000107800001158000011a8000010f800001448000015580000108800001548000010a8000010001168000010001238000011a800001038000015380","weights":""},{"rows":25,"cols":24,"src":"Quest/schematics.png tiles:32x32","ani":[],"map":"BC16:0x:b00403000100000002001a8014810380168101000100000000000300000000000c8000000300038101000100000000000300138101000100030004810c80058101000100038103000f810300000000000100010016810100010005810c80058101000100108103000581010001001681010001000881068208810100010008810200048102000881010001000681030000000682000003000681010001001681010001000000000001001381010001000000000001000200068100010b8101000100000000000100000003000a81030003000581010001000f8103000300058101000100000000000100058105800681010000000000010001000000000001000200030005810200078102000100000000000100010000000000010004810300000000000200030007810100000000000100010008810580068101000000000001000100128102000100000000001980","weights":""},{"rows":25,"cols":24},[{"name":"#15","type":"questEvil","x":192,"y":448},{"name":"#14","type":"questEvil","x":384,"y":640},{"name":"#13","type":"questEvil","x":416,"y":512},{"name":"#12","type":"questEvil","x":672,"y":512},{"name":"#11","type":"questEvil","x":672,"y":416},{"name":"#10","type":"questEvil","x":672,"y":320},{"name":"#9","type":"questEvil","x":672,"y":224},{"name":"#8","type":"questEvil","x":544,"y":224},{"name":"#7","type":"questEvil","x":544,"y":192},{"name":"#6","type":"questTest","x":160,"y":352},{"name":"#5","type":"questTest","x":224,"y":512},{"name":"#4","type":"questTest","x":608,"y":512},{"name":"#3","type":"questTest","x":608,"y":352},{"name":"#2","type":"questTest","x":416,"y":320},{"name":"#1","type":"questTest","x":320,"y":320}],{},{"rows":25,"cols":24,"src":"Quest/map.png tiles:32x32","ani":[],"map":"BC16:0x:b004050002000000ff000400fe001a801481038016810200020005810c8005810200020016810200020005820c8005820200020016820200020016820200020005820c800582020002001682020002001682020002000882068308820200020008820400ff000000ff00ff00040008820200020008820683088202000200168202000200ff00ff000200138202000200fe00fe0002000400128402000200fe00fe000200138402000200168402000200fe00fe0002000584058006840200fe00fe0002000200fe00fe000200040006840400078404000200fe00fe0002000200fe00fe0002000784040008840200fe00fe00020002000884058006840200fe00fe0002000200128404000200fe00fe001980","weights":""},{"out":[]}],"layers":[{"name":"back","type":1},{"name":"scheme","type":2},{"name":"regions","type":32},{"name":"entities","type":4,"primary":true},{"name":"parts","type":8},{"name":"over","type":1},{"name":"transitions","type":16}]};
	
	manager.createRoom("quest.rooms.rooma", room);
	
	//Remember to add extra code!
	
	return room;
})());
