const chalk = require("chalk");
const tasks = require.main.require("./bundles/tasks.js");
const server = require.main.require('./bundles/server.js');

module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["dump", "d"],
			"run": this.runCommand,
			"helpCategory": "Storage",
			"helpSyntax": ["dump <type> <amount>"],
			"helpText": "Dumps an <amount> of resource <type>"
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }

		const storageModule = character.modules.find(module => { return module.name === "Storage" })

		if (storageModule === undefined) {
			socket.emit('output', { msg: chalk.red("Storage module could not be found, software error!") });
			return;
		}

		const dumpAction = storageModule.actions.find(action => { return action.name === "dump" })

		if (dumpAction === undefined) {
			socket.emit('output', { msg: chalk.red("Dump action could not be found, software error!") });
			return;
		}

		const parts = arguments.trim().split(" ")

		if (parts.length !== 2) {
			socket.emit('output', { msg: chalk.red("Wrong command syntax") });
			return;
		}

		const type = parts[0].toUpperCase()
		const amount = parseInt(parts[1])

		if (type !== "RAW" && type !== "MET" && type !== "SIL") {
			socket.emit('output', { msg: chalk.red("Resource type " + type + " not recognized") });
			return;
		}

		const materialStored = character.storage.find(stored => { return type === stored.type })

		if (materialStored === undefined) {
			socket.emit('output', { msg: chalk.red("Storage does not contain resources of type " + type) });
			return;
		} else if (materialStored.amount < amount) {
			socket.emit('output', { msg:
					chalk.red("Storage does not contain at least " + amount + " " + type
						+ ", has " + materialStored.amount)
			});
			return;
		}

		const task = tasks.createTask(
			"Dumping " + type,
			"Storage",
			"command-dump",
			dumpAction.duration,
			[],
			[],
			{
				"type": type,
				"amount": amount
			}
		)

		tasks.addTask(task, character, socket)
	},

	runTask : function (task, character, socket) {
		const materialStored = character.storage.find(stored => { return task.payload.type === stored.type })
		materialStored.amount -= task.payload.amount
		const storageModule = character.modules.find(module => { return module.name === "Storage" })
		storageModule.current -= task.payload.amount

		socket.emit('output', { msg: chalk.green("Storage of " + task.payload.type + " reduced by " +
				task.payload.amount + " to " + materialStored.amount) });
	}
}
