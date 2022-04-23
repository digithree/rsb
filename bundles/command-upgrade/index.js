const chalk = require("chalk");
const server = require.main.require('./bundles/server.js');
const tasks = require.main.require("./bundles/tasks.js");
const upgrades = require.main.require("./bundles/upgrades.js");

module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["upgrade", "u"],
			"run": this.runCommand,
			"helpCategory": "Modules",
			"helpSyntax": ["upgrade <module>"],
			"helpText": "Upgrade a module. Must have the required NRG in battery and resources in storage."
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }

		arguments = arguments.toLowerCase();

		const module = character.modules.find(el => { return el.name.toLowerCase() === arguments})

		if (module === undefined) {
			socket.emit('output', { msg: chalk.red("Cannot locate module \"" + arguments + "\" to upgrade, did you misspell it?") })
		} else if (!module.upgradeable) {
			socket.emit('output', {msg: chalk.red("Module \"" + arguments + "\" cannot be upgraded")})
		} else if (module.level === 0) {
			socket.emit('output', {msg: chalk.red("Module \"" + arguments + "\" is broken, first fix this module")})
		} else {
			const upgradeSpecItem = module.upgradeSpec.find(spec => { return spec.level === (module.level + 1) })
			if (upgradeSpecItem === undefined) {
				socket.emit('output', {msg: chalk.yellow("Module \"" + arguments + "\" cannot be upgraded, at maximum level")})
			} else {
				const task = tasks.createTask(
					"Upgrade " + module.name,
					"Arms",
					"command-upgrade",
					upgradeSpecItem.duration,
					upgradeSpecItem.costs,
					[],
					upgrades.createUpgradeTaskPayload(module.name, module.level + 1)
				)

				tasks.addTask(task, character, socket)
			}
		}
	},

	runTask : function (task, character, socket) {
		upgrades.applyUpgrade(task.payload.moduleName, task.payload.newLevel, character, socket)

		// show status for newly upgraded module
		const statusCommand = server.commands.find(cmd => { return cmd.keywords.find(k => { return k === "status" }) })
		if (statusCommand) {
			statusCommand.run(task.payload.moduleName, character, socket)
		}
	}
}
