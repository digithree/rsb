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
			"keywords": ["harvest", "v"],
			"run": this.runCommand,
			"helpCategory": "Factory",
			"helpSyntax": ["harvest"],
			"helpText": "Harvest material from the current location."
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }
		
		// Make arguments case-insensitive
		//arguments = arguments.toLowerCase();

		// TODO : add task details for harvest task
		const task = new tasks.Task()

		const result = tasks.addTask(
			task, character, socket
		)

		let output = ""

		if (result) {
			output += chalk.green("Task \"" + task.name + "\" started")
		} else {
			output += chalk.red("Task \"" + task.name + "\" could NOT be started")
		}

		socket.emit('output', { msg: output });
	},
}
