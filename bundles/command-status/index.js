const chalk = require("chalk");
const Table = require('cli-table');
const Overlap = require("overlap")
const Box = require("cli-box");
const fs = require('fs');
const {botNamesFirst} = require("../character-creator");
const config = require.main.require('./config.js');
const server = require.main.require('./bundles/server.js');
const world = server.bundles.world;

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

function statusColor(status) {
	let col = colors.cyan;
	if (status.error) {
		col = colors.red
	} else if (status.current < status.warningBelow || status.current > status.warningAbove) {
		col = colors.orange
	} else if (status.active) {
		col = colors.green
	}
	return col
}

function colorizeBot(statuses) {
	const segments = []
	statuses.forEach(status => {
		if (status.colorize) {
			status.colorize.forEach(col => {
				segments.push({
					"start": (col.y * BOT_GRAPHIC_WIDTH) + col.x,
					"len": col.len,
					"col": statusColor(status)
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

// command to get the status of the current bot.
module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {};

		command["keywords"] = ["status", "s"];
		command["run"] = this.runCommand;
		command["helpCategory"] = "Information";
		command["helpSyntax"] = ["status", "status <area>"];
		command["helpText"] = "Display the current bot status.";		
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character, socket) {
		// Command can only be used by player-controlled characters (not NPC:s)
		if (!socket) { return; }
		
		// Make arguments case-insensitive
		arguments = arguments.toLowerCase();

		const statuses = character.modules;

		let output = "";

		// "Status". No arguments (i.e. "status" or "status bot"), so status of bot
		if (arguments === "" || arguments === "bot") {
			output += "Modules status:\n\n";
			let netEnergy = 0;
			let availableEnergy = 0;

			let table = new Table({
				head: [
					chalk.whiteBright.bold("NAME"),
					chalk.whiteBright.bold("NRG COST"),
					chalk.whiteBright.bold("YIELDS"),
					chalk.whiteBright.bold("ACTIVE")
				],
				colWidths: [20, 10, 8, 8],
			});

			statuses.forEach(status => {
				let col = statusColor(status)
				const colText = chalk.hex(col)

				let energyUsage = chalk.gray(status.energy)
				if (status.active && !status.error && status.energy > 0) {
					energyUsage = chalk.yellowBright(status.energy)
				} else if (status.active && !status.error && status.energy < 0) {
					energyUsage = chalk.greenBright(status.energy)
				} else if (status.energy === 0) {
					energyUsage = ""
				}

				table.push(
					[
						colText(status.name),
						energyUsage,
						(status.active && !status.error && status.yieldType !== ""
								? chalk.greenBright(status.yield + " " + status.yieldType)
								: ""
						),
						status.active ? chalk.greenBright("YES") : ""
					]
				)

				availableEnergy += status.active && !status.error ? status.energy * -1 : 0
				if (status.active && !status.error && status.yieldType === "NRG") {
					netEnergy += status.yield
				} else if (status.active && !status.error && status.energy > 0) {
					netEnergy -= status.energy
				}
			})

			const botBox = colorizeBot(statuses)

			output += Overlap({
				who: table.toString(),
				with: botBox,
				where: {
					x: 52,
					y: 2
				}
			}) + "\n"

			output += "\nEnergy (NRG) status:\n\n"

			table = new Table({
				colWidths: [20, 10],
			});

			let col = colors.green
			if (availableEnergy < 5) {
				col = colors.orange
			} else if (availableEnergy < 0) {
				col = colors.red
			}
			let colText = chalk.hex(col);
			table.push(
				['Available energy', colText(availableEnergy)]
			)

			col = colors.green
			if (netEnergy < 5) {
				col = colors.orange
			} else if (netEnergy < 0) {
				col = colors.red
			}
			colText = chalk.hex(col)
			table.push(
				['Net energy', colText(netEnergy)]
			)

			output += table.toString() + "\n"

			if (netEnergy >= 0) {
				output += chalk.green('Positive net energy: battery will not deplete')
			} else {
				output += chalk.hex(colors.orange)('NEGATIVE net energy: battery WILL deplete')
			}
		} else if (arguments) {
			// "Status <object>". Get a specific status
			const status = statuses.find(el => el.name.toLowerCase() === arguments);

			if (status) {
				let col = statusColor(status)
				const colText = chalk.hex(col)

				const warning = status.current < status.warningBelow || status.current > status.warningAbove
				let warningText = ""
				if (warning) {
					warningText = status.valueTerm.toLowerCase() + " is too "
						+ (status.current < status.warningBelow ? "LOW" : "HIGH")
				}

				const maxLine = 27
				const table = new Table({
					colWidths: [16, 30]
				});
				table.push(
					[chalk.white('Name'), chalk.bold(wrap(status.name, maxLine))],
					[chalk.white('Type'), status.type],
					[chalk.white('Description'), wrap(status.description, maxLine)],
					[chalk.white('Status'), colText(wrap(status.status, maxLine))],
					[chalk.white('Is Active?'), (status.active ? chalk.greenBright('YES') : chalk.gray('NO'))],
					[chalk.white('Has Error?'), (status.error ? chalk.redBright('YES') : chalk.gray('NO'))],
					[chalk.white('Warning?'), (warning ? chalk.hex(colors.orange)(wrap(warningText, maxLine)) : chalk.gray('None'))]
				)

				if (status.valueTerm !== "") {
					table.push(
						[
							chalk.white(status.valueTerm),
							(status.current < status.warningBelow || status.current > status.warningAbove
									? chalk.yellow(status.current)
									: chalk.greenBright(status.current)
							) + chalk.white(' / ' + status.max)
						]
					)
				}
				table.push(
					[
						chalk.white('Energy usage'),
						(status.energy <= 0 ? chalk.green(status.energy) : chalk.yellowBright(status.energy))
							+ (!status.active ? chalk.gray(" when active") : "")
					]
				)
				if (status.yield > 0) {
					table.push([chalk.white('Yield'), chalk.bold(status.yield) + " " + status.yieldType + " per hour"])
				}
				let actions = chalk.gray("None")
				if (status.actions.length !== 0) {
					actions = status.actions.join(", ")
				}
				table.push([chalk.white('Actions'), actions])

				const botBox = colorizeBot([status])

				output += Overlap({
					who: table.toString(),
					with: botBox,
					where: {
						x: 50,
						y: 2
					}
				}) + "\n"
			} else {
				output += "Status not found for area " + chalk.bgRed(arguments)
			}
		}
		socket.emit('output', { msg: output });
	},
}
