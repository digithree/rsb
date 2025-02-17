const chalk = require("chalk");
const tasks = require.main.require("./bundles/tasks.js");
const server = require.main.require('./bundles/server.js');

module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["harvest", "v"],
			"run": this.runCommand,
			"helpCategory": "Environment",
			"helpSyntax": ["harvest"],
			"helpText": "Harvest material from the current location."
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }

		const module = character.modules.find(module => { return module.name === "Arms" })

		if (module === undefined) {
			socket.emit('output', { msg: chalk.red("Arms module could not be found, software error!") });
			return;
		}

		const action = module.actions.find(action => { return action.name === "harvest" })

		if (action === undefined) {
			socket.emit('output', { msg: chalk.red("Harvest action could not be found, software error!") });
			return;
		}

		const task = tasks.createTaskWithAction(
			"Harvesting materials",
			"Arms",
			"command-harvest",
			action
		)

		tasks.addTask(task, character, socket)
	},

	runTask : function (task, character, socket) {
		// nothing particular to do, but this function must exist
	}
}
