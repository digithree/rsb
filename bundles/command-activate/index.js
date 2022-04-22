//const chalk = require("chalk");
//const Table = require('cli-table');
//const Overlap = require("overlap")
//const Box = require("cli-box");
//const fs = require('fs');
//const config = require.main.require('./config.js');
const chalk = require("chalk");
const tasks = require.main.require("./bundles/tasks.js");
const server = require.main.require('./bundles/server.js');
//const world = server.bundles.world;

module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["activate", "a"],
			"run": this.runCommand,
			"helpCategory": "Modules",
			"helpSyntax": ["activate <module>"],
			"helpText": "Activate a module <module>."
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }
		
		// Make arguments case-insensitive
		arguments = arguments.toLowerCase();

		// check arguments exist
		if (arguments === undefined || arguments === null || arguments === "") {
			socket.emit('output', { msg: chalk.red("activate must specify a module") });
			return;
		}

		const status = character.modules.find(status => { return status.name.toLowerCase() === arguments })

		// check status found for module
		if (status === undefined) {
			socket.emit('output', { msg: chalk.red("Could not find module " + arguments) });
			return;
		}

		let netEnergy = 0;
		let availableEnergy = 0;

		character.modules.forEach(status => {
			availableEnergy += !status.error ? status.energy * -1 : 0
			if (!status.error && status.yieldType === "NRG") {
				netEnergy += status.yield
			} else if (!status.error && status.energy > 0) {
				netEnergy -= status.energy
			}
		})

		if (availableEnergy - status.energy < 0) {
			socket.emit('output', {
				msg: chalk.red("Energy required for module " + status.name + " (" + status.energy
						+ " NRG) is more than available energy (" + availableEnergy + " NRG)"
					)
			});
			return;
		}

		// update the status, takes effect in DB as is same object and DB is a mem based DB
		// TODO : this whole module needs to be rethought
		//status.active = true

		const netNetEnergy = netEnergy - status.energy

		socket.emit('output', {
			msg: chalk.green("Module " + status.name + " is now active")
				+ ((netNetEnergy < 0)
					? chalk.yellow("\nSystem now in negative net energy (" + netNetEnergy + " NRG), be careful!")
					: ""
				)
		});
	},
}
