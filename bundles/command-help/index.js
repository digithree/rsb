const chalk = require("chalk");
const Table = require("cli-table");
const server = require.main.require('./bundles/server.js');
const tasks = require.main.require("./bundles/tasks.js");
const tasksUtils = require.main.require("./bundles/tasks-utils.js");

module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["info", "i", "help", "h"],
			"run": this.runCommand.bind(this),
			"helpCategory": "Meta",
			"helpSyntax": ["info", "info <command> | help <command>"],
			"helpText": "Shows a information on all available commands, or information about a specific command."
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		let content;
		let i;
// command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }
		
		arguments = arguments.toLowerCase();

		// list of disabled commands from the current player character
		const disabledCommands = [];
		character.modules.forEach(module => {
			if (module.level === 0) {
				module.actions.forEach(action => disabledCommands.push(action))
			}
		})
		
		// "help" without argument. Display all available commands. 
		if (arguments === "") {
			const categories = [];
			const commandList = {};
			const commandOrder = [];
			const commandsByCategory = {};
			for (i = 0; i < server.commands.length; i++) {
				let command = server.commands[i];
				// if command not disabled
				if (disabledCommands.find(el => { return command.keywords.find(el2 => { return el2 === el }) }) === undefined) {
					commandList[command.keywords[0]] = command;
					commandOrder.push(command.keywords[0]);
					if (command.helpCategory && categories.indexOf(command.helpCategory) === -1) {
						categories.push(command.helpCategory);
					}

					if (!commandsByCategory[command.helpCategory]) {
						commandsByCategory[command.helpCategory] = [];
					}
					commandsByCategory[command.helpCategory].push(command.keywords[0]);
					commandsByCategory[command.helpCategory].sort()
				}
			}
			commandOrder.sort();
			categories.sort();
			
			
			content = chalk.bold("Available commands") + "\nType \"info <command>\" for additional information.\n\n";

			for (i = 0; i < categories.length; i++) {
				const category = categories[i];
				content += chalk.bold(category) + " - ";
				content += commandsByCategory[category].join(", ");
				content += "\n";
			}

			socket.emit('output', { msg: content });
		} else {
			// "help <command>" with argument. Display info about a specific command.

			// loop through all commands until we have a match
			let hasMatch = false;
			let command;
			for (i = 0; i < server.commands.length; i++) {
				command = server.commands[i];

				// Check if the typed in command matches any of the current command's keywords
				if (command.keywords.indexOf(arguments) !== -1) {
					// and exit from loop, we don't want more matches.
					hasMatch = true;
					break;
				}
			}

			// check if a command is disabled
			if (hasMatch
				&& disabledCommands.find(el => { return command.keywords.find(el2 => { return el2 === el }) }) !== undefined
			) {
				hasMatch = false
			}
			
			if (!hasMatch) {
				socket.emit('output', {
					msg: "That's not a valid command. Type "
						+ chalk.bgWhite.black("help")
						+ " for a list of commands."
				});
				return;
			}
			
			// display command information
			content = "";
			content += chalk.bold(command.keywords[0]) + "\n";
			if (command.keywords[1]) {
				content += chalk.white("Aliases: ") + command.keywords.join(", ") + "\n";
			}
			content += chalk.white("Category: ") + command.helpCategory + "\n";
			content += chalk.white("Syntax: ") + command.helpSyntax.join(", ") + "\n";
			if (command.helpExample) {
				content += chalk.white("Example use: ") + command.helpExample.join(", ") + "\n";
			}
			content += "\n" + command.helpText + "\n";

			const moduleForAction = character.modules.find(module => {
				return module.actions.find(action => { return action.name === command.keywords[0]})
			})
			if (moduleForAction) {
				const action = moduleForAction.actions.find(action => { return action.name === command.keywords[0]})

				if (action && action.showCosts) {
					const table = new Table({
						head: [
							chalk.whiteBright.bold("RUN COST"),
							chalk.whiteBright.bold("DURATION"),
							chalk.whiteBright.bold("OUTPUT"),
						],
						colWidths: [18, 10, 18],
						chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
					});
					table.push(
						[
							action.costs.length > 0 ? tasksUtils.getCostsTable(action.costs) : chalk.green("\nFree"),
							action.duration >= 0 ? ("\n" + action.duration) : chalk.green("\nInstant"),
							action.output.length > 0 ? tasksUtils.getCostsTable(action.output) : chalk.white("\nDoes Action")
						]
					)
					content += table.toString() + "\n"
				}
			}

			socket.emit('output', { msg: content });
		}
	}
}
