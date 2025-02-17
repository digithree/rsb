const chalk = require("chalk");
const Table = require('cli-table');
const Overlap = require("overlap")
const Box = require("cli-box");
const fs = require('fs');
const tasks = require.main.require("./bundles/tasks.js");
const utils = require.main.require("./bundles/utils.js");
const server = require.main.require('./bundles/server.js');
const upgrades = require.main.require("./bundles/upgrades.js");
const storage = require.main.require("./bundles/storage.js");
const tasksUtils = require.main.require("./bundles/tasks-utils.js");

const botGraphic = fs.readFileSync('./ascii-img/bot.txt').toString()
const BOT_GRAPHIC_WIDTH = 24

function moduleColor(module, character) {
	const isTaskActive = character.tasks.find(task => { return task.moduleName === module.name }) !== undefined
	const permType = module.type === "perm"

	let col = utils.colors.cyan;
	if (module.level === 0) {
		col = utils.colors.red
	} else if (module.current < module.warningBelow || module.current > module.warningAbove) {
		col = utils.colors.orange
	} else if (permType) {
		col = utils.colors.green
	} else if (isTaskActive) {
		col = utils.colors.magenta
	}
	return col
}

function colorizeBot(modules, character) {
	const segments = []
	modules.forEach(module => {
		if (module.colorize) {
			module.colorize.forEach(col => {
				segments.push({
					"start": (col.y * BOT_GRAPHIC_WIDTH) + col.x,
					"len": col.len,
					"col": moduleColor(module, character)
				})
			})
		}
	})
	let botGfx = botGraphic
	segments
		.sort((a, b) => { return b.start - a.start })
		.forEach(data => {
		botGfx = botGfx.substring(0, data.start)
			+ chalk.hex(data.col)(botGfx.substring(data.start, data.start + data.len))
			+ botGfx.substring(data.start + data.len, botGfx.length)
	})
	const botBox = Box("25x14", {
		text: botGfx
	}).toString()
	const title = "Bot diagram"
	return botBox.substring(0, 2) + title + botBox.substring(2 + title.length, botBox.length)
}

// command to get the status of the current bot.
module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["status", "s"],
			"run": this.runCommand,
			"helpCategory": "Management",
			"helpSyntax": ["status", "status <area>"],
			"helpText": "Display the current bot status.",
			"enabled": true
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }
		
		// Make arguments case-insensitive
		arguments = arguments.toLowerCase();

		let output = "";

		// "Status". No arguments (i.e. "status" or "status bot"), so status of bot
		if (arguments === "" || arguments === "bot") {
			output += "Modules status:\n";

			let table = new Table({
				head: [
					chalk.whiteBright.bold("NAME"),
					chalk.whiteBright.bold("NRG COST"),
					chalk.whiteBright.bold("YIELDS"),
					chalk.whiteBright.bold("ACTIVE")
				],
				colWidths: [20, 10, 9, 8],
				chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
			});

			const namePadWidth = 18
			const costPadWidth = 8

			character.modules.forEach(module => {
				let col = moduleColor(module, character)
				const colText = chalk.hex(col)

				const isTaskActive = character.tasks.find(task => { return task.moduleName === module.name }) !== undefined
				const permType = module.type === "perm"

				let energyUsage = utils.padGrayDots("" + module.energy, costPadWidth, chalk.gray)
				if ((isTaskActive || permType) && module.level > 0 && module.energy > 0) {
					energyUsage = utils.padGrayDots("" + module.energy, costPadWidth, chalk.yellowBright)
				} else if ((isTaskActive || permType) && module.level > 0 && module.energy < 0) {
					energyUsage = utils.padGrayDots("" + module.energy, costPadWidth, chalk.greenBright)
				} else if (module.energy === 0) {
					energyUsage = utils.padGrayDots("", costPadWidth)
				}

				let activeText = ""
				if (permType) {
					activeText = chalk.green("PERM")
				} else if (isTaskActive) {
					activeText = chalk.hex(utils.colors.magenta)("TASK")
				} else if (module.level > 0) {
					activeText = chalk.hex(utils.colors.cyan)("IDLE")
				}

				table.push(
					[
						utils.padGrayDots(module.name, namePadWidth, colText),
						energyUsage,
						((isTaskActive || permType) && module.level > 0 && module.yieldType !== ""
								? chalk.greenBright(module.yield + " " + module.yieldType)
								: chalk.gray(module.yield + " " + module.yieldType) //utils.padGrayDots("", yieldsPadWidth)
						),
						activeText
					]
				)
			})

			const botBox = colorizeBot(character.modules, character)

			output += Overlap({
				who: table.toString(),
				with: botBox,
				where: {
					x: 53,
					y: 0
				}
			})

			socket.emit('output', { msg: output });

			storage.printResources(character, socket)
		} else if (arguments) {
			// "Status <object>". Get a specific status
			const module = character.modules.find(el => el.name.toLowerCase() === arguments);

			if (module) {
				let col = moduleColor(module, character)
				const colText = chalk.hex(col)

				const warning = module.current < module.warningBelow || module.current > module.warningAbove
				let warningText = ""
				if (warning) {
					warningText = module.valueTerm.toLowerCase() + " is too "
						+ (module.current < module.warningBelow ? "LOW" : "HIGH")
				}

				const maxLine = 27
				const table = new Table({
					colWidths: [16, 30],
					chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
				});
				const namePadWidth = 14

				const activeTask = character.tasks.find(task => { return task.moduleName === module.name })

				let activity = ""
				if (module.type === "perm") {
					activity = colText(utils.wrap("Permanently active", maxLine))
				} else if (module.type === "tasks") {
					if (activeTask) {
						activity = colText(utils.wrap("Task active: " + activeTask.name, maxLine))
					} else {
						activity = chalk.gray(utils.wrap("No task currently active", maxLine))
					}
				}

				const upgradeSpecs = upgrades.specs.find(el => { return el.name.toLowerCase() === module.name.toLowerCase()})
				let upgradeTitle = "Upgradable?"
				let upgradeText = ""
				if (!module.upgradeable) {
					upgradeText = chalk.yellow("No")
				} else if (module.level === 0) {
					upgradeTitle = "Fixable?"
					const upgradeSpecItem = upgradeSpecs.levels.find(spec => { return spec.level === 1 })
					if (upgradeSpecItem === undefined) {
						upgradeText = chalk.red('SOFTWARE ERROR')
					} else {
						upgradeText = "Fix duration " + upgradeSpecItem.duration + ", costs:\n" +
							tasksUtils.getCostsTable(upgradeSpecItem.costs)
					}
				} else {
					const upgradeSpecItem = upgradeSpecs.levels.find(spec => { return spec.level === (module.level + 1) })
					if (upgradeSpecItem === undefined) {
						upgradeText = chalk.yellow('At max level')
					} else {
						upgradeText = "Level " + (module.level + 1) + " duration " + upgradeSpecItem.duration +
							", costs:\n" + tasksUtils.getCostsTable(upgradeSpecItem.costs)
					}
				}

				table.push(
					[utils.padGrayDots("Name", namePadWidth, chalk.white), chalk.bold(utils.wrap(module.name, maxLine))],
					[utils.padGrayDots("Category", namePadWidth, chalk.white), module.category],
					[utils.padGrayDots("Type", namePadWidth, chalk.white), module.type.toUpperCase()],
					[utils.padGrayDots("Description", namePadWidth, chalk.white), utils.wrap(module.description, maxLine)],
					[utils.padGrayDots("Status", namePadWidth, chalk.white), colText(utils.wrap(module.status, maxLine))]
				)
				if (module.upgradeable && module.level > 0) {
					table.push(
						[
							utils.padGrayDots("Level", namePadWidth, chalk.white),
							colText(utils.wrap("" + module.level, maxLine))
						]
					)
				}
				table.push(
					[utils.padGrayDots(upgradeTitle, namePadWidth, chalk.white), upgradeText],
					[utils.padGrayDots("Error?", namePadWidth, chalk.white), (module.level === 0 ? chalk.redBright('ERROR') : chalk.gray('None'))],
					[utils.padGrayDots("Warning?", namePadWidth, chalk.white), (warning ? chalk.hex(utils.colors.orange)(utils.wrap(warningText, maxLine)) : chalk.gray('None'))],
					[utils.padGrayDots("Activity", namePadWidth, chalk.white), activity],
				)

				if (module.valueTerm !== "") {
					table.push(
						[
							utils.padGrayDots(module.valueTerm, namePadWidth, chalk.white),
							(module.current < module.warningBelow || module.current > module.warningAbove
									? chalk.yellow(module.current)
									: chalk.greenBright(module.current)
							) + chalk.white(' / ' + module.max)
						]
					)
				}
				if (module.name === "Storage") {
					let storageText = ""
					if (character.storage.length > 0) {
						storageText = tasksUtils.getCostsTable(character.storage)
					} else {
						storageText = chalk.gray("None")
					}
					table.push([utils.padGrayDots("Storage", namePadWidth, chalk.white), storageText])
				}
				table.push(
					[
						utils.padGrayDots("Energy usage", namePadWidth, chalk.white),
						(module.energy <= 0 ? chalk.green(module.energy) : chalk.yellowBright(module.energy))
							+ (module.energy !== 0 ? chalk.white(" per " + tasks.TIME_UNIT_READABLE) : "")
							+ (!(module.type === "perm" || activeTask !== undefined)
								? chalk.gray(", when active")
								: ""
							)
					]
				)
				if (module.yield > 0) {
					table.push([
						utils.padGrayDots("Yield", namePadWidth, chalk.white),
						chalk.bold(module.yield) + " " + module.yieldType + " per hour"
					])
				}
				let actions = chalk.gray("None")
				if (module.actions.length !== 0) {
					actions = module.actions.map(action => { return action.name })
				}
				table.push([utils.padGrayDots("Actions", namePadWidth, chalk.white), actions])

				const botBox = colorizeBot([module], character)

				output += Overlap({
					who: table.toString()+ ("\n" + " ".repeat(16)).repeat(3),
					with: botBox,
					where: {
						x: 50,
						y: 0
					}
				}) + "\n"
			} else {
				output += "Status not found for area " + chalk.bgRed(arguments)
			}
			socket.emit('output', { msg: output });
		}
	},
}
