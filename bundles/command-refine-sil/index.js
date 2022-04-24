const chalk = require("chalk");
const tasks = require.main.require("./bundles/tasks.js");
const server = require.main.require('./bundles/server.js');

module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["refine-sil", "rs"],
			"run": this.runCommand,
			"helpCategory": "Refinery",
			"helpSyntax": ["refine-sil"],
			"helpText": "Refines silicon (SIL) from raw materials (RAW)."
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }

		const module = character.modules.find(module => { return module.name === "Silicon refinery" })

		if (module === undefined) {
			socket.emit('output', { msg: chalk.red("Silicon refinery module could not be found, software error!") });
			return;
		}

		const action = module.actions.find(action => { return action.name === "refine-sil" })

		if (action === undefined) {
			socket.emit('output', { msg: chalk.red("refine-sil action could not be found, software error!") });
			return;
		}

		const task = tasks.createTaskWithAction(
			"Refining silicon",
			"Silicon refinery",
			"command-refine-sil",
			action
		)

		tasks.addTask(task, character, socket)
	},

	runTask : function (task, character, socket) {
		// nothing to do
	}
}
