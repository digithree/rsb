const chalk = require("chalk");
const Table = require('cli-table');
const config = require.main.require('./config.js');
const server = require.main.require('./bundles/server.js');
const world = server.bundles.world;
const colors = {
	"red": "#FF0000",
	"green": "#00FF00",
	"orange": "#FF9933",
	"blue": "#0000FF",
	"magenta": "#FF00FF",
	"cyan": "#00FFFF",
	"white": "#FFFFFF"
}

// command to get the status of the current bot.
module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {};

		command["keywords"] = ["status", "s"];
		command["run"] = this.runCommand;
		command["helpCategory"] = "Information";
		command["helpSyntax"] = ["status", "status <area>"];
		command["helpText"] = "Display the current bot status.";		
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }
		
		// Make arguments case-insensitive
		arguments = arguments.toLowerCase();

		//var room = server.db.getEntity(socket.character.location);

		// TODO : move to DB
		const statuses = [
			{
				"name": "Radio",
				"type": "Communications",
				"description": "Allows for remote control and communication.",
				"status": "Operational",
				"active": true,
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
				"yieldType": ""
			},
			{
				"name": "Radar",
				"type": "Sensor",
				"description": "Sees local area.",
				"status": "Unknown damage!",
				"active": false,
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
				"yieldType": ""
			},
			{
				"name": "SOS Eye",
				"type": "Sensor",
				"description": "Star Orientation System Eye:\nDetermines location in galaxy.",
				"status": "Unknown damage!",
				"active": false,
				"error": true,
				"level": 1,
				"max": 1,
				"current": 0,
				"valueTerm": "",
				"warningBelow": 0,
				"warningAbove": 1,
				"actions": ["scan-local"],
				"energy": 10,
				"yield": 0,
				"yieldType": ""
			},
			{
				"name": "Memory",
				"type": "Circuitry",
				"description": "Onboard computer memory. Capacity limits operations.",
				"status": "Reduced capacity!",
				"active": true,
				"error": false,
				"level": 1,
				"max": 1048576, //2^20
				"current": 128,
				"valueTerm": "Bytes",
				"warningBelow": 1024,
				"warningAbove": 1048576, //2^20
				"actions": [],
				"energy": 2,
				"yield": 0,
				"yieldType": ""
			},
			{
				"name": "Legs",
				"type": "Actuator",
				"description": "Claw-like legs. Facilitate latching and movement.",
				"status": "Latched to surface but motor stuck!",
				"active": false,
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
				"yieldType": ""
			},
			{
				"name": "Arms",
				"type": "Actuator",
				"description": "Clamps on arms. May manipulate close-by\nobjects and materials.",
				"status": "Operational",
				"active": false,
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
				"yieldType": ""
			},
			{
				"name": "Silicon extractor",
				"type": "Extractor",
				"description": "Materials processing for silicon, extracting\nfrom rocks and debris.",
				"status": "Operational",
				"active": false,
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
				"yieldType": "SIL"
			},
			{
				"name": "Metals extractor",
				"type": "Extractor",
				"description": "Materials processing for metals, extracting\nfrom rocks and debris.",
				"status": "Operational",
				"active": false,
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
				"yieldType": "MET"
			},
			{
				"name": "Materials storage",
				"type": "Storage",
				"description": "General purpose storage for materials.",
				"status": "Operational",
				"active": true,
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
				"yieldType": ""
			},
			{
				"name": "Module factory",
				"type": "Factory",
				"description": "A module which can build other modules.",
				"status": "Operational",
				"active": false,
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
				"yieldType": "MOD"
			},
			{
				"name": "Solar panel",
				"type": "Energy",
				"description": "Energy harvesting from light energy.",
				"status": "Panel damage!",
				"active": true,
				"error": false,
				"level": 1,
				"max": 100,
				"current": 5,
				"valueTerm": "Energy input",
				"warningBelow": 20,
				"warningAbove": 100,
				"actions": [],
				"energy": 0,
				"yield": 6,
				"yieldType": "NRG"
			},
			{
				"name": "Battery",
				"type": "Energy",
				"description": "Energy storage for bot computer, sensors\nand actuators.",
				"status": "Low capacity!",
				"active": true,
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
				"yieldType": ""
			},
			{
				"name": "Fuel",
				"type": "Energy",
				"description": "Fuel storage for engines.",
				"status": "Operational",
				"active": false,
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
				"yieldType": ""
			},
			{
				"name": "Ion Engine",
				"type": "Engine",
				"description": "Propulsion engine for slow, long journeys.",
				"status": "Unknown damage!",
				"active": false,
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
				"yieldType": ""
			},
		];

		// "Status". No arguments (i.e. "status" or "status bot"), so status of bot
		if (arguments === "" || arguments === "bot") {
			let output = "Modules status:\n\n";
			let netEnergy = 0;
			let availableEnergy = 0;

			let table = new Table({
				head: [
					chalk.whiteBright.bold("NAME"),
					chalk.whiteBright.bold("NRG COST"),
					chalk.whiteBright.bold("YIELDS"),
					chalk.whiteBright.bold("DETAILS")
				],
				colWidths: [20, 10, 10, 20],
			});

			statuses.forEach(status => {
				let col = colors.cyan;
				if (status.error) {
					col = colors.red
				} else if (status.current < status.warningBelow || status.current > status.warningAbove) {
					col = colors.orange
				} else if (status.active) {
					col = colors.green
				}
				const colText = chalk.hex(col)
				let energyUsage = chalk.gray(status.energy)
				if (status.active && !status.error && status.energy > 0) {
					energyUsage = chalk.yellowBright(status.energy)
				} else if (status.active && !status.error && status.energy < 0) {
					energyUsage = chalk.greenBright(status.energy)
				} else if (status.energy === 0) {
					energyUsage = ""
				}
				table.push(
					[
						colText(status.name),
						energyUsage,
						(status.active && !status.error && status.yieldType !== ""
								? chalk.greenBright(status.yield + " " + status.yieldType)
								: ""
						),
						(status.active ? chalk.greenBright('[ACTIVE] ') : chalk.gray('[INACTIVE] '))
							+ (status.error ? chalk.redBright(' [ERR]') : '')
					]
				)

				availableEnergy += status.active && !status.error ? status.energy * -1 : 0
				if (status.active && !status.error && status.yieldType === "NRG") {
					netEnergy += status.yield
				} else if (status.active && !status.error && status.energy > 0) {
					netEnergy -= status.energy
				}
			})

			output += table.toString() + "\n"

			output += "\nEnergy (NRG) status:\n\n"

			table = new Table({
				colWidths: [20, 10],
			});

			let col = colors.green
			if (availableEnergy < 5) {
				col = colors.orange
			} else if (availableEnergy < 0) {
				col = colors.red
			}
			let colText = chalk.hex(col);
			table.push(
				['Available energy', colText(availableEnergy)]
			)

			col = colors.green
			if (netEnergy < 5) {
				col = colors.orange
			} else if (netEnergy < 0) {
				col = colors.red
			}
			colText = chalk.hex(col)
			table.push(
				['Net energy', colText(netEnergy)]
			)

			output += table.toString() + "\n"

			if (netEnergy >= 0) {
				output += chalk.green('Positive net energy: battery will not deplete')
			} else {
				output += chalk.hex(colors.orange)('NEGATIVE net energy: battery WILL deplete')
			}
			
			socket.emit('output', { msg: output });
		} else if (arguments) {
			// "Status <object>". Get a specific status
			const status = statuses.find(el => el.name.toLowerCase() === arguments);

			let output = "";
			let col = colors.cyan;
			if (status.error) {
				col = colors.red
			} else if (status.current < status.warningBelow || status.current > status.warningAbove) {
				col = colors.orange
			} else if (status.active) {
				col = colors.green
			}
			const colText = chalk.hex(col)

			const warning = status.current < status.warningBelow || status.current > status.warningAbove
			let warningText = ""
			if (warning) {
				warningText = "YES - " + status.valueTerm.toLowerCase() + " is too "
					+ (status.current < status.warningBelow ? "LOW" : "HIGH")
			}

			if (status) {
				const table = new Table({
					colWidths: [16, 50]
				});
				table.push(
					[chalk.white('Name'), chalk.bold(status.name)],
					[chalk.white('Type'), status.type],
					[chalk.white('Description'), status.description],
					[chalk.white('Status'), colText(status.status)],
					[chalk.white('Is Active?'), (status.active ? chalk.greenBright('YES') : chalk.gray('NO'))],
					[chalk.white('Has Error?'), (status.error ? chalk.redBright('YES') : chalk.gray('NO'))],
					[chalk.white('Has warning?'), (warning ? chalk.hex(colors.orange)(warningText) : chalk.gray('NO'))]
				)

				if (status.valueTerm !== "") {
					table.push(
						[
							chalk.white(status.valueTerm),
							(status.current < status.warningBelow || status.current > status.warningAbove
									? chalk.yellow(status.current)
									: chalk.greenBright(status.current)
							) + chalk.white(' / ' + status.max)
						]
					)
				}
				table.push(
					[
						chalk.white('Energy usage'),
						(status.energy <= 0 ? chalk.green(status.energy) : chalk.yellowBright(status.energy))
							+ (!status.active ? chalk.gray(" when active") : "")
					]
				)
				if (status.yield > 0) {
					table.push([chalk.white('Yield'), chalk.bold(status.yield) + " units per hour"])
				}
				let actions = chalk.gray("None")
				if (status.actions.length !== 0) {
					actions = status.actions.join(", ")
				}
				table.push([chalk.white('Actions'), actions])

				output += table.toString() + '\n';
			} else {
				output += "Status not found for area " + chalk.bgRed(arguments)
			}
			socket.emit('output', { msg: output });
		}
	},
}
