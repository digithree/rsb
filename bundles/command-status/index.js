const chalk = require("chalk");
const Table = require('cli-table');
const Overlap = require("overlap")
const Box = require("cli-box");
const fs = require('fs');
const tasks = require.main.require("./bundles/tasks.js");
const server = require.main.require('./bundles/server.js');
const energy = require.main.require('./bundles/energy.js');

const botGraphic = fs.readFileSync('./ascii-img/bot.txt').toString()
const BOT_GRAPHIC_WIDTH = 24
const colors = {
	"red": "#FF0000",
	"green": "#00FF00",
	"orange": "#FF9933",
	"blue": "#0000FF",
	"magenta": "#FF00FF",
	"cyan": "#00FFFF",
	"white": "#FFFFFF"
}

function moduleColor(module, character) {
	const isTaskActive = character.tasks.find(task => { return task.moduleName === module.name }) !== undefined
	const permType = module.type === "perm"

	let col = colors.cyan;
	if (module.error) {
		col = colors.red
	} else if (module.current < module.warningBelow || module.current > module.warningAbove) {
		col = colors.orange
	} else if (permType) {
		col = colors.green
	} else if (isTaskActive) {
		col = colors.magenta
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

const wrap = (s, w) => s.replace(
	new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n'
);

const padGrayDots = (s, w, colFn = (s) => {return s}) => (w - s.length) > 0 ?
	colFn(s) + chalk.gray(".".repeat(w - s.length))
	: colFn(s)

// command to get the status of the current bot.
module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["status", "s"],
			"run": this.runCommand,
			"helpCategory": "Information",
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
			output += "Modules status:\n\n";
			const energyStats = energy.energyStats(character)
			const batteryModule = character.modules.find(el => { return el.name === "Battery"})
			const storageModule = character.modules.find(el => { return el.name === "Materials storage"})

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
			const yieldsPadWidth = 7

			character.modules.forEach(module => {
				let col = moduleColor(module, character)
				const colText = chalk.hex(col)

				const isTaskActive = character.tasks.find(task => { return task.moduleName === module.name }) !== undefined
				const permType = module.type === "perm"

				let energyUsage = padGrayDots("" + module.energy, costPadWidth, chalk.gray)
				if ((isTaskActive || permType) && !module.error && module.energy > 0) {
					energyUsage = padGrayDots("" + module.energy, costPadWidth, chalk.yellowBright)
				} else if ((isTaskActive || permType) && !module.error && module.energy < 0) {
					energyUsage = padGrayDots("" + module.energy, costPadWidth, chalk.greenBright)
				} else if (module.energy === 0) {
					energyUsage = padGrayDots("", costPadWidth)
				}

				let activeText = ""
				if (permType) {
					activeText = chalk.green("PERM")
				} else if (isTaskActive) {
					activeText = chalk.hex(colors.magenta)("TASK")
				}

				table.push(
					[
						padGrayDots(module.name, namePadWidth, colText),
						energyUsage,
						((isTaskActive || permType) && !module.error && module.yieldType !== ""
								? chalk.greenBright(module.yield + " " + module.yieldType)
								: chalk.gray(module.yield + " " + module.yieldType) //padGrayDots("", yieldsPadWidth)
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
					y: 1
				}
			}) + "\n"

			output += "\nResources:\n\n"

			table = new Table({
				colWidths: [20, 10],
				chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
			});

			let col = colors.green
			if (energyStats.battery < batteryModule.warningBelow) {
				col = colors.orange
			} else if (energyStats.battery < 0) {
				col = colors.red
			}
			let colText = chalk.hex(col);
			table.push(
				[padGrayDots("Battery", namePadWidth, chalk.white), colText(energyStats.battery)]
			)

			col = colors.green
			if (energyStats.netEnergy === 0) {
				col = colors.orange
			} else if (energyStats.netEnergy < 0) {
				col = colors.red
			}
			colText = chalk.hex(col)
			table.push(
				[padGrayDots("Net energy", namePadWidth, chalk.white), colText(energyStats.netEnergy)]
			)

			col = colors.green
			if (storageModule.current === storageModule.max) {
				col = colors.red
			} else if (storageModule.current > storageModule.warningAbove) {
				col = colors.orange
			}
			colText = chalk.hex(col)
			table.push(
				[padGrayDots("Storage", namePadWidth, chalk.white), colText(storageModule.current + " / " + storageModule.max)]
			)

			output += table.toString() + "\n"

			if (energyStats.netEnergy >= 0) {
				output += chalk.green('Positive net energy: battery will not deplete')
			} else {
				output += chalk.hex(colors.orange)('NEGATIVE net energy: battery WILL deplete')
			}
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
					activity = colText(wrap("Permanently active", maxLine))
				} else if (module.type === "tasks") {
					if (activeTask) {
						activity = colText(wrap("Task active: " + activeTask.name, maxLine))
					} else {
						activity = chalk.gray(wrap("No task currently active", maxLine))
					}
				}

				table.push(
					[padGrayDots("Name", namePadWidth, chalk.white), chalk.bold(wrap(module.name, maxLine))],
					[padGrayDots("Category", namePadWidth, chalk.white), module.category],
					[padGrayDots("Type", namePadWidth, chalk.white), module.type.toUpperCase()],
					[padGrayDots("Description", namePadWidth, chalk.white), wrap(module.description, maxLine)],
					[padGrayDots("Status", namePadWidth, chalk.white), colText(wrap(module.status, maxLine))],
					[padGrayDots("Error?", namePadWidth, chalk.white), (module.error ? chalk.redBright('ERROR') : chalk.gray('None'))],
					[padGrayDots("Warning?", namePadWidth, chalk.white), (warning ? chalk.hex(colors.orange)(wrap(warningText, maxLine)) : chalk.gray('None'))],
					[padGrayDots("Activity", namePadWidth, chalk.white), activity],
				)

				if (module.valueTerm !== "") {
					table.push(
						[
							padGrayDots(module.valueTerm, namePadWidth, chalk.white),
							(module.current < module.warningBelow || module.current > module.warningAbove
									? chalk.yellow(module.current)
									: chalk.greenBright(module.current)
							) + chalk.white(' / ' + module.max)
						]
					)
				}
				if (module.name === "Materials storage") {
					let storageText = ""
					if (character.storage.length > 0) {
						let first = true
						character.storage.forEach(item => {
							if (!first) {
								storageText += "\n"
							}
							first = false
							storageText += "" + item.amount + " " + item.type
						})
					} else {
						storageText = chalk.gray("None")
					}
					table.push([padGrayDots("Storage", namePadWidth, chalk.white), storageText])
				}
				table.push(
					[
						padGrayDots("Energy usage", namePadWidth, chalk.white),
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
						padGrayDots("Yield", namePadWidth, chalk.white),
						chalk.bold(module.yield) + " " + module.yieldType + " per hour"
					])
				}
				let actions = chalk.gray("None")
				if (module.actions.length !== 0) {
					actions = module.actions.join(", ")
				}
				table.push([padGrayDots("Actions", namePadWidth, chalk.white), actions])

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
		}
		socket.emit('output', { msg: output });
	},
}
