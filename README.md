
# WebMUD

A modular [MUD](https://en.wikipedia.org/wiki/MUD) framework for [Node.js](https://nodejs.org/en/) based on [Socket.IO](https://socket.io/) instead of Telnet, with a web-based client for connecting to the MUD through your browser. It uses [LokiJS](http://lokijs.org) for fast persistant in-memory storage, which works with the database in memory, but saves it to a database.json file at regular intervals.

## Features

- Starts a simple web server (Express) with an interface for connecting to the MUD right through your browser.
- A modular approach from the ground up, allowing it to be used as a micro framework for any type of MUD.
- Includes basic MUD objects such as rooms and characters, and basic commands for world interaction.

## Installation

1. Install [Node.js](https://nodejs.org/en/).
1. Download or clone the WebMUD project into a local folder and go into that folder.
2. Type `npm install` in the terminal to install all required packages.
3. Type `npm start` to start the web server.

Point your browser to `http://localhost:3000` to connect to your MUD.

Once connected, you can create an account and character and log into the game world. You can then type "help" to see a list of all available commands.

## Bundles

The modules in WebMUD are called *bundles* and are placed in the "/bundles" directory. The following bundles are included by default:
* **database-lokijs**: Sets up a LokiJS database.
* **welcome**: Displays a welcome message to the user. This is the default starting bundle that is run when a user first connects to the server.
* **login**: This bundle is called from the "welcome" bundle and gives step-by-step instructions for logging in or creating a new account.
* **character-creator**: After logging in, this bundle is run to help you create an in-game character.
* **world**: After choosing a character, you're sent into the game world. This bundle contains the basic logic used by the game world, such as parsing of in-game commands and helper functions for moving objects between containers and rooms.
* **command-xxx**: The bundles that start with "command-" add support for commands that can be used in the game world. For example "command-look" adds support for the "look" command, which you can type to look at the room you're standing in or examine an object. Command bundles doesn't have to be named this way, but it makes it easier to separate them from other bundles. There's also a "help" command that you can type to see a list of all available commands.

### Bundles details

A bundle can be anything from a login screen parser to an in-game command, or an entire combat engine. They're very flexible in their design, to allow for as much customization and modularity as possible. What bundles are loaded at server startup is defined in config.js, as well as what specific bundle to run when a user first connects (the so called "starting bundle"), which is normally some kind of welcome or login screen.

A bundle can have both an init() method that is called once globally as soon as the server starts and the module is loaded, and a run() method that is used to run the bundle on demand for a connected user (a.k.a. a "socket"). The init() method can be used to modify global variables, such as adding a new command to the game world, while run() can be used if the bundle is supposed to be run for each user (e.g. display a login screen when a user connects).
