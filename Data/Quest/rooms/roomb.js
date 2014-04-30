"use strict";

dusk.load.require("dusk.quest");
dusk.load.require("dusk.entities");
dusk.load.provide("example.plat.rooms.roomb");

example.plat.rooms.roomb = [{"rows":27,"cols":24,"src":"pimg/techB.png","ani":[["1,0","2,0","3,0","2,0"],["4,0","5,0","6,0","5,0"]],"map":"BC16:0x:100501000000ff80ff808a80"},{"rows":27,"cols":24,"src":"pimg/schematics.png","ani":[],"map":"BC16:0x:1005020000000100488019810001000114800100010000010001148016810000000001000100168001000100168001000100168001000100168001000100168001000100168001000100168001000100168001000100168001000100168001000100168001000100168001000100168001000100168001000100168001000100168019814880"},[{"name":"####16","type":"walk","x":602,"y":224},{"name":"####15","type":"walk","x":602,"y":256},{"name":"####14","type":"walk","x":602,"y":288},{"name":"####13","type":"walk","x":602,"y":320},{"name":"####12","type":"walk","x":602,"y":352},{"name":"####11","type":"walk","x":602,"y":384},{"name":"####10","type":"walk","x":602,"y":416},{"name":"####9","type":"walk","x":602,"y":448},{"name":"####8","type":"walk","x":602,"y":480},{"name":"####7","type":"walk","x":602,"y":512},{"name":"####6","type":"walk","x":602,"y":544},{"name":"####5","type":"walk","x":602,"y":576},{"name":"####4","type":"walk","x":602,"y":608},{"name":"####3","type":"walk","x":602,"y":640},{"name":"####2","type":"walk","x":602,"y":672},{"name":"####1","type":"walk","x":602,"y":704},{"name":"###16","type":"walk","x":637,"y":224},{"name":"###15","type":"walk","x":637,"y":256},{"name":"###14","type":"walk","x":637,"y":288},{"name":"###13","type":"walk","x":637,"y":320},{"name":"###12","type":"walk","x":637,"y":352},{"name":"###11","type":"walk","x":637,"y":384},{"name":"###10","type":"walk","x":637,"y":416},{"name":"###9","type":"walk","x":637,"y":448},{"name":"###8","type":"walk","x":637,"y":480},{"name":"###7","type":"walk","x":637,"y":512},{"name":"###6","type":"walk","x":637,"y":544},{"name":"###5","type":"walk","x":637,"y":576},{"name":"###4","type":"walk","x":637,"y":608},{"name":"###3","type":"walk","x":637,"y":640},{"name":"###2","type":"walk","x":637,"y":672},{"name":"###1","type":"walk","x":637,"y":704},{"name":"##16","type":"walk","x":669,"y":224},{"name":"##15","type":"walk","x":669,"y":256},{"name":"##14","type":"walk","x":669,"y":288},{"name":"##13","type":"walk","x":669,"y":320},{"name":"##12","type":"walk","x":669,"y":352},{"name":"##11","type":"walk","x":669,"y":384},{"name":"##10","type":"walk","x":669,"y":416},{"name":"##9","type":"walk","x":669,"y":448},{"name":"##8","type":"walk","x":669,"y":480},{"name":"##7","type":"walk","x":669,"y":512},{"name":"##6","type":"walk","x":669,"y":544},{"name":"##5","type":"walk","x":669,"y":576},{"name":"##4","type":"walk","x":669,"y":608},{"name":"##3","type":"walk","x":669,"y":640},{"name":"##2","type":"walk","x":669,"y":672},{"name":"##1","type":"walk","x":669,"y":704},{"name":"#16","type":"walk","x":701,"y":224},{"name":"#15","type":"walk","x":701,"y":256},{"name":"#14","type":"walk","x":701,"y":288},{"name":"#13","type":"walk","x":701,"y":320},{"name":"#12","type":"walk","x":701,"y":352},{"name":"#11","type":"walk","x":701,"y":384},{"name":"#10","type":"walk","x":701,"y":416},{"name":"#9","type":"walk","x":701,"y":448},{"name":"#8","type":"walk","x":701,"y":480},{"name":"#7","type":"walk","x":701,"y":512},{"name":"#6","type":"walk","x":701,"y":544},{"name":"#5","type":"walk","x":701,"y":576},{"name":"#4","type":"walk","x":701,"y":608},{"name":"#3","type":"walk","x":701,"y":640},{"name":"#2","type":"walk","x":701,"y":672},{"name":"#1","type":"walk","x":701,"y":704}],{},{"rows":27,"cols":24,"src":"pimg/techO.png","ani":[],"map":"BC16:0x:10050200010000006180020002001481010001000200020014811680030003000100010016810100010016810100010016810100010016810100010016810100010016810100010016810100010016810100010016810100010016810100010016810100010016810100010016810100010016810100010016810100010016816180"},{"out":[[".entType=player",0,false,{"package":"example.plat.rooms.exhall","room":"exhall","mark":2}]]}];

dusk.plat.rooms.createRoom("roomb", example.plat.rooms.roomb);