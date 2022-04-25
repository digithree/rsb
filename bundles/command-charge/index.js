const chalk = require("chalk");
const tasks = require.main.require("./bundles/tasks.js");
const server = require.main.require('./bundles/server.js');

module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["charge", "c"],
			"run": this.runCommand,
			"helpCategory": "Fuel",
			"helpSyntax": ["charge"],
			"helpText": "Charged battery with NRG."
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }

		const module = character.modules.find(module => { return module.name === "Solar panel" })

		if (module === undefined) {
			socket.emit('output', { msg: chalk.red("Solar panel module could not be found, software error!") });
			return;
		}

		const action = module.actions.find(action => { return action.name === "charge" })

		if (action === undefined) {
			socket.emit('output', { msg: chalk.red("charge action could not be found, software error!") });
			return;
		}

		const task = tasks.createTaskWithAction(
			"Charging battery",
			"Solar panel",
			"command-charge",
			action
		)

		tasks.addTask(task, character, socket)
	},

	runTask : function (task, character, socket) {
		// nothing to do
	}
}
