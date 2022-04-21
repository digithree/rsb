const server = require.main.require('./bundles/server.js');

// command for disconnecting from a character.
module.exports = {
	// called when bundle is loaded
	init : function () {
		const command = {
			"keywords": ["quit", "q", "exit"],
			"run": this.runCommand,
			"helpCategory": "Meta",
			"helpSyntax": ["quit"],
			"helpText": "Quits the game and disconnects from your character."
		};
		
		server.commands.push(command);
	},
	
	runCommand : function (arguments, character) {
		// try to get socket if character has a player connected
		const socket = server.bundles.world.getSocketFromCharacter(character);

		// Command is only interesting for player characters
		if (!socket) { return; }
		
		// Disconnect character
		server.bundles.world.disconnectPlayerCharacter(socket);
	}
}