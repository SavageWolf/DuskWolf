//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("tests.label", (function() {
	var sgui = load.require("dusk.sgui");
	var PlusText = load.require("dusk.sgui.PlusText");
	var Group = load.require("dusk.sgui.Group");
	var Rect = load.require("dusk.sgui.Rect");
	var Label = load.require("dusk.sgui.Label");
	var dusk = load.require("dusk");
	var Runner = load.require("dusk.script.Runner");
	
	sgui.get("default", true).update({
		allowMouse:true,
		children:{
			a:{
				type:"Label",
				x:10,
				y:10,
				text:"Test text... [b]Bold[/b] [i]Italic[/i] [u]Underline[/u] [font serif]Font[/font]\
					[bsize 2][bcolour #ff0000]Border[/bcolour][/bsize]"
			},
			b:{
				type:"Label",
				x:10,
				y:30,
				multiline:true,
				width:200,
				text:"Test Multiline...\n[b]Bold[/b]\n[i]Italic[/i]\n[u]Underline[/u]\n[font serif]Font[/font]\
					\n[bsize 2][bcolour #ff0000]Border[/bcolour][/bsize]"
			},
			
			c:{
				type:"Label",
				x:220,
				y:30,
				width:200,
				text:"Test width... [b]Bold[/b] [i]Italic[/i] [u]Underline[/u] [font serif]Font[/font]\
					[bsize 2][bcolour #ff0000]Border[/bcolour][/bsize]"
			},
			
			dg:{
				type:"Group",
				width:200,
				x:220,
				y:50,
				children:{
					d:{
						type:"Label",
						xDisplay:"expand",
						multiline:true,
						text:"Multiline text in a expand box thing!\nLorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumyeirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diamvoluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumyeirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diamvoluptua. At vero eos et accusam et justo duo dolores et ea reb"
					},
				},
			},
		}
	});
	
	window.dg = sgui.path("default:/dg");
	
	dusk.startGame();
})());