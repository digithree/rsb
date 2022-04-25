const chalk = require("chalk");
const server = require.main.require('./bundles/server.js');
const tasks = require.main.require("./bundles/tasks.js");
const upgrades = require.main.require("./bundles/upgrades.js");

module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["fix", "f"],
			"run": this.runCommand,
			"helpCategory": "Modules",
			"helpSyntax": ["fix <module>"],
			"helpText": "Fix a broken module. Must have the required NRG in battery and resources in storage."
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }

		arguments = arguments.toLowerCase();

		const module = character.modules.find(el => { return el.name.toLowerCase() === arguments})
		const upgradeSpecs = upgrades.specs.find(el => { return el.name.toLowerCase() === arguments})

		if (module === undefined) {
			socket.emit('output', {msg: chalk.red("Cannot locate module \"" + arguments + "\" to fix, did you misspell it?")})
		} else if (upgradeSpecs === undefined) {
			socket.emit('output', { msg: chalk.red("Cannot locate upgrade specs for \"" + arguments + "\" to fix, did you misspell it?") })
		} else if (module.level > 0) {
			socket.emit('output', {msg: chalk.yellow("Module \"" + arguments + "\" does not need to be fixed!")})
		} else if (!module.upgradeable) {
			socket.emit('output', {msg: chalk.red("Module \"" + arguments + "\" cannot be fixed, permanently broken!")})
		} else {
			const upgradeSpecItem = upgradeSpecs.levels.find(spec => { return spec.level === 1 })
			if (upgradeSpecItem === undefined) {
				socket.emit('output', {msg: chalk.red("Module \"" + arguments + "\" cannot be fixed, permanently broken!")})
			} else {
				const task = tasks.createTask(
					"Fix " + module.name,
					"Arms",
					"command-fix",
					upgradeSpecItem.duration,
					upgradeSpecItem.costs,
					[],
					upgrades.createUpgradeTaskPayload(module.name, 1)
				)

				tasks.addTask(task, character, socket)
			}
		}
	},

	runTask : function (task, character, socket) {
		socket.emit('output', {msg: chalk.green("Module \"" + task.payload.moduleName + "\" is fixed")})

		upgrades.applyUpgrade(task.payload.moduleName, task.payload.newLevel, character, socket)

		// show status for newly upgraded module
		const statusCommand = server.commands.find(cmd => { return cmd.keywords.find(k => { return k === "status" }) })
		if (statusCommand) {
			statusCommand.run(task.payload.moduleName, character, socket)
		}
	}
}
