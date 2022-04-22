const chalk = require("chalk");
const config = require.main.require('./config.js');
const server = require.main.require('./bundles/server.js');
const uuidv4 = require('uuid').v4;

// after logging in, this bundle is run to help you create and choose an in-game character to play with.
module.exports = {
	// Called when bundle is loaded
	init : function () {
		// nothing to do
	},
	
	// called when bundle is run
	run : function (socket) {
		this.chooseCharacter(socket);
	},
	
	// show "Choose character" selection screen
	chooseCharacter : function (socket) {
		// make sure that the account has a characters array.
		if (!("characters" in socket.account)) {
			socket.account.characters = [];
		}

		let output = chalk.white("Choose bot (enter number):\n");

		// also show option for creating new character
		output += "0) " + chalk.yellow("[Register new bot]\n")
		
		// list all characters on this account as 1) <character name>, 2) <character name> etc
		for (let i = 0; i < socket.account.characters.length; i++) {
			const characterId = socket.account.characters[i];
			const character = server.db.getEntity(characterId);
			output += (i+1) + ") " + chalk.greenBright(character.name) + "\n"
		}
		output += "\n"

		socket.emit('output', { msg: output });

		// listen for input from user
		socket.once('input', function (data) {
			// check if we got a valid character index from the user
			const characterIndex = parseInt(data.msg) - 1;
			if (parseInt(data.msg) === 0) {
				this.createCharacter(socket);
			} else if (typeof socket.account.characters[characterIndex] != "undefined") {
				// valid character choice, so login to world with this character
				const characterId = socket.account.characters[characterIndex];
				this.loginWithCharacter(socket, server.db.getEntity(characterId));
			} else {
				// invalid character choice
				this.chooseCharacter(socket);
			}
		}.bind(this));
	},
	
	// create a new character
	createCharacter : function (socket) {
		const name = this.botNamesFirst[Math.floor(Math.random() * this.botNamesFirst.length)]
			+ ' ' + this.botNamesSecond[Math.floor(Math.random() * this.botNamesSecond.length)];
		const uuid = uuidv4();
		socket.emit('output', { msg: "You have been assigned bot: " + chalk.green(name) + ' / ' + chalk.gray(uuid) });

		const character = server.db.insertEntity({
			name: name,
			uuid: uuid,
			type: "og-bot",
			level: 1,
			playerCharacter: true,
			modules: this.startingModules,
			tasks: []
		});

		socket.account.characters.push(server.db.getId(character));
		
		this.chooseCharacter(socket);
	},
	
	loginWithCharacter : function (socket, character) {		
		socket.character = character;
		
		server.runBundle("world", socket);
	},

	"botNamesFirst": [
		"Scan",
		"Displace",
		"Reduction",
		"Ridge",
		"Soap",
		"Stab",
		"Dull",
		"Polish",
		"Dash",
		"Remain",
		"Light",
		"Squash",
		"Cherry",
		"Rational",
		"Mystery",
		"Tough",
		"Glare",
		"Denial",
		"Jest",
		"Polite",
		"Spite",
		"Complex",
		"Raw",
		"Fast",
		"Spy",
		"Distant",
		"Lawful",
		"Techno",
		"Neon"
	],

	"botNamesSecond": [
		"Sun",
		"Hiccup",
		"Carrot",
		"Motor",
		"Cave",
		"Pig",
		"Ant",
		"Rise",
		"Hold",
		"Spectrum",
		"Wing",
		"Stitch",
		"Score",
		"Clone",
		"Deed"
	],

	"startingModules": [
		{
			"name": "Radio",
			"type": "perm",
			"category": "Communications",
			"description": "Allows for remote control and communication.",
			"status": "Operational",
			"error": false,
			"level": 1,
			"max": 1,
			"current": 1,
			"valueTerm": "",
			"warningBelow": 0,
			"warningAbove": 1,
			"actions": [],
			"energy": 3,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 6,
					y: 7,
					len: 3
				}
			]
		},
		{
			"name": "Radar",
			"type": "tasks",
			"category": "Sensor",
			"description": "Sees local area.",
			"status": "Unknown damage!",
			"error": true,
			"level": 1,
			"max": 1,
			"current": 0,
			"valueTerm": "",
			"warningBelow": 0,
			"warningAbove": 1,
			"actions": ["scan-local"],
			"energy": 50,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 5,
					y: 3,
					len: 1
				}
			]
		},
		{
			"name": "SOS Eye",
			"type": "tasks",
			"category": "Sensor",
			"description": "Star Orientation System Eye: Determines location in galaxy.",
			"status": "Unknown damage!",
			"error": true,
			"level": 1,
			"max": 1,
			"current": 0,
			"valueTerm": "",
			"warningBelow": 0,
			"warningAbove": 1,
			"actions": ["scan-far"],
			"energy": 10,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 17,
					y: 3,
					len: 1
				}
			]
		},
		{
			"name": "Memory",
			"type": "perm",
			"category": "Circuitry",
			"description": "Onboard computer memory. Capacity limits operations.",
			"status": "Reduced capacity!",
			"error": false,
			"level": 1,
			"max": 2048, //2^11
			"current": 128,
			"valueTerm": "Bytes",
			"warningBelow": 1024,
			"warningAbove": 1048576, //2^20
			"actions": [],
			"energy": 2,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 6,
					y: 9,
					len: 3
				}
			]
		},
		{
			"name": "Legs",
			"type": "tasks",
			"category": "Actuator",
			"description": "Claw-like legs. Facilitate latching and movement.",
			"status": "Latched to surface but motor stuck!",
			"error": true,
			"level": 1,
			"max": 1,
			"current": 0,
			"valueTerm": "",
			"warningBelow": 0,
			"warningAbove": 1,
			"actions": ["crawl", "push", "latch"],
			"energy": 10,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 0,
					y: 3,
					len: 3
				},
				{
					x: 2,
					y: 4,
					len: 3
				},
				{
					x: 1,
					y: 6,
					len: 4
				},
				{
					x: 1,
					y: 8,
					len: 4
				},
				{
					x: 2,
					y: 10,
					len: 3
				},
				{
					x: 0,
					y: 11,
					len: 3
				},
				{
					x: 20,
					y: 3,
					len: 3
				},
				{
					x: 18,
					y: 4,
					len: 3
				},
				{
					x: 18,
					y: 6,
					len: 4
				},
				{
					x: 18,
					y: 8,
					len: 4
				},
				{
					x: 18,
					y: 10,
					len: 3
				},
				{
					x: 20,
					y: 11,
					len: 3
				},
			]
		},
		{
			"name": "Arms",
			"type": "tasks",
			"category": "Actuator",
			"description": "Clamps on arms. May manipulate close-by objects and materials.",
			"status": "Operational",
			"error": false,
			"level": 1,
			"max": 1,
			"current": 0,
			"valueTerm": "",
			"warningBelow": 0,
			"warningAbove": 1,
			"actions": ["harvest", "repair", "build"],
			"energy": 5,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 6,
					y: 0,
					len: 3
				},
				{
					x: 14,
					y: 0,
					len: 3
				},
				{
					x: 6,
					y: 1,
					len: 1
				},
				{
					x: 16,
					y: 1,
					len: 1
				},
				{
					x: 6,
					y: 2,
					len: 3
				},
				{
					x: 14,
					y: 2,
					len: 3
				},
			]
		},
		{
			"name": "Silicon extractor",
			"type": "tasks",
			"category": "Extractor",
			"description": "Materials processing for silicon, extracting from rocks and debris.",
			"status": "Operational",
			"error": false,
			"level": 1,
			"max": 1,
			"current": 0,
			"valueTerm": "",
			"warningBelow": 0,
			"warningAbove": 1,
			"actions": [],
			"energy": 2,
			"yield": 1,
			"yieldType": "SIL",
			"colorize": [
				{
					x: 14,
					y: 5,
					len: 3
				}
			]
		},
		{
			"name": "Metals extractor",
			"type": "tasks",
			"category": "Extractor",
			"description": "Materials processing for metals, extracting from rocks and debris.",
			"status": "Operational",
			"error": false,
			"level": 1,
			"max": 1,
			"current": 0,
			"valueTerm": "",
			"warningBelow": 0,
			"warningAbove": 1,
			"actions": [],
			"energy": 3,
			"yield": 2,
			"yieldType": "MET",
			"colorize": [
				{
					x: 6,
					y: 5,
					len: 3
				}
			]
		},
		{
			"name": "Materials storage",
			"type": "perm",
			"category": "Storage",
			"description": "General purpose storage for materials.",
			"status": "Operational",
			"error": false,
			"level": 1,
			"max": 40,
			"current": 0,
			"valueTerm": "Capacity",
			"warningBelow": 0,
			"warningAbove": 35,
			"actions": [],
			"energy": 0,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 10,
					y: 3,
					len: 3
				},
				{
					x: 10,
					y: 4,
					len: 3
				}
			]
		},
		{
			"name": "Module factory",
			"type": "tasks",
			"category": "Factory",
			"description": "A module which can build other modules.",
			"status": "Operational",
			"error": false,
			"level": 1,
			"max": 1,
			"current": 0,
			"valueTerm": "",
			"warningBelow": 0,
			"warningAbove": 1,
			"actions": ["fabricate"],
			"energy": 40,
			"yield": 0.4,
			"yieldType": "MOD",
			"colorize": [
				{
					x: 10,
					y: 5,
					len: 3
				}
			]
		},
		{
			"name": "Solar panel",
			"type": "perm",
			"category": "Energy",
			"description": "Energy harvesting from light energy.",
			"status": "Panel damage!",
			"error": false,
			"level": 1,
			"max": 100,
			"current": 5,
			"valueTerm": "Energy output",
			"warningBelow": 20,
			"warningAbove": 100,
			"actions": [],
			"energy": 0,
			"yield": 6,
			"yieldType": "NRG",
			"colorize": [
				{
					x: 6,
					y: 10,
					len: 11
				}
			]
		},
		{
			"name": "Battery",
			"type": "perm",
			"category": "Energy",
			"description": "Energy storage for bot computer, sensors and actuators.",
			"status": "Low capacity!",
			"error": false,
			"level": 1,
			"max": 20,
			"current": 20,
			"valueTerm": "Stored",
			"warningBelow": 50,
			"warningAbove": 100,
			"actions": [],
			"energy": -10,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 14,
					y: 9,
					len: 3
				}
			]
		},
		{
			"name": "Fuel",
			"type": "perm",
			"category": "Energy",
			"description": "Fuel storage for engines.",
			"status": "Operational",
			"error": false,
			"level": 1,
			"max": 100,
			"current": 0,
			"valueTerm": "Stored",
			"warningBelow": 40,
			"warningAbove": 100,
			"actions": [],
			"energy": 0,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 10,
					y: 9,
					len: 3
				}
			]
		},
		{
			"name": "Ion Engine",
			"type": "tasks",
			"category": "Engine",
			"description": "Propulsion engine for slow, long journeys.",
			"status": "Unknown damage!",
			"error": true,
			"level": 1,
			"max": 1,
			"current": 0,
			"valueTerm": "Thrust",
			"warningBelow": 0,
			"warningAbove": 1,
			"actions": ["fly"],
			"energy": 1000,
			"yield": 0,
			"yieldType": "",
			"colorize": [
				{
					x: 8,
					y: 12,
					len: 7
				},
				{
					x: 8,
					y: 13,
					len: 7
				}
			]
		},
	]
}
