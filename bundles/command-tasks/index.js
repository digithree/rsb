const chalk = require("chalk");
const tasks = require.main.require("./bundles/tasks.js");
const server = require.main.require('./bundles/server.js');

module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["tasks", "t"],
			"run": this.runCommand,
			"helpCategory": "Management",
			"helpSyntax": ["tasks <pop | abort>"],
			"helpText": "Information and management of tasks" +
				"\n\t"+chalk.cyanBright("tasks")+"\t\tshow currently running tasks queue" +
				"\n\t"+chalk.cyanBright("tasks pop")+"\tpop (remove and cancel) last added task from queue" + chalk.yellow("*") +
				"\n\t"+chalk.cyanBright("tasks abort")+"\tremove and cancel ALL tasks in queue" + chalk.yellow("*") +
				"\n\n\t*" + chalk.yellow("note that cancelling tasks permanently wastes input NRG and resources")
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }

		const completedTasks = tasks.completedTasksCount(character)

		arguments = arguments.toLowerCase();

		if (arguments === undefined || arguments === null || arguments === "") {
			if (character.tasks.length === 0) {
				socket.emit('output', { msg: chalk.yellow("No tasks currently queued") })
			} // else do nothing, tasks section always shows after a command is run
		} else if (arguments === "pop") {
			if (character.tasks.length === 0) {
				socket.emit('output', { msg: chalk.red("Cannot pop task, no tasks are queued") })
			} else if (completedTasks === character.tasks.length) {
				socket.emit('output', { msg: chalk.yellow("Cannot pop task, last task is already complete") })
			} else {
				const task = character.tasks.pop()
				socket.emit('output', { msg: chalk.white("Popped task " + task.name) })
			}
		} else if (arguments === "abort") {
			if (character.tasks.length === 0) {
				socket.emit('output', { msg: chalk.red("Cannot abort tasks, no tasks are queued") })
			} else if (completedTasks > 0) {
				socket.emit('output', { msg: chalk.yellow("Cannot abort tasks, some tasks already complete") })
			} else {
				socket.emit('output', { msg: chalk.white("Aborted " + character.tasks.length + " task(s)") })
				character.tasks = []
			}
		}
	},
}
