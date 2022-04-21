//const chalk = require("chalk");
//const Table = require('cli-table');
//const Overlap = require("overlap")
//const Box = require("cli-box");
//const fs = require('fs');
//const config = require.main.require('./config.js');
const server = require.main.require('./bundles/server.js');
//const world = server.bundles.world;

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
		
		// Make arguments case-insensitive
		arguments = arguments.toLowerCase();

		socket.emit('output', { msg: "Command harvest is not implemented yet!" });
	},
}
