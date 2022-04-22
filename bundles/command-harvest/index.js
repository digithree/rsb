const chalk = require("chalk");
const tasks = require.main.require("./bundles/tasks.js");
const storage = require.main.require("./bundles/storage.js");
const server = require.main.require('./bundles/server.js');

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

		const armsModule = character.modules.find(module => { return module.name === "Arms" })

		if (armsModule === undefined) {
			socket.emit('output', { msg: chalk.red("Arms module could not be found, software error!") });
			return;
		}

		// TODO : add task details for harvest task
		const task = tasks.createTask(
			"Harvesting materials",
			armsModule.level,
			"command-harvest",
			armsModule.name,
			10,
			{
				"cost": [], //energy cost is implicit, can add any additional costs here
				"output": [
					{
						"amount": 20,
						"type": "RAW"
					}
				]
			}
		)

		const result = tasks.addTask(
			task, character, socket
		)
		// ignore result
	},

	runTask : function (task, character, socket) {
		storage.storeMaterials(task.payload.output, character, socket)
	}
}
