const chalk = require("chalk");
const server = require.main.require('./bundles/server.js');

module.exports = {
    "TIME_UNIT": 1000, // 1 sec
    "TIME_UNIT_READABLE": "sec", // 1 sec

    createTask : function (name, level, bundle, moduleName, duration, payload) {
        return {
            "name": name,
            "level": level,
            "bundle": bundle,
            "moduleName": moduleName,
            "startTime": (new Date()).getTime(),
            "duration": duration,
            "payload": payload,
            "complete": false
        }
    },

    addTask : function (task, character, socket) {
        const memoryBytes = character.modules.find(el => { return el.name === "Memory"}).current
        const maxTasks = (Math.floor(Math.log(memoryBytes) / Math.log(2))) - 6
        console.log("Max tasks: " + maxTasks)
        let result = {
            added: true,
            msg: chalk.green("Task \"" + task.name + "\" started")
        }
        if (character.tasks.length >= maxTasks) {
            result = {
                added: false,
                msg: chalk.red("Task \"" + task.name + "\" could NOT be started, not enough memory!")
            }
        } else if (character.tasks.find(el => { return el.name === task.name}) !== undefined) {
            result = {
                added: false,
                msg: chalk.red("Task \"" + task.name + "\" could NOT be started, this task already active!")
            }
        }
        socket.emit('output', { msg: result.msg });
        if (result.added) {
            character.tasks.push(task)
            this.processTasks(character, socket, task.startTime)
        }
        return result.added
    },

    processTasks : function (character, socket, currentTime = (new Date()).getTime()) {
        const hasTasks = character.tasks.length > 0
        if (hasTasks) {
            socket.emit('output', { msg: chalk.blue("-".repeat(5) + "TASKS REMINDERS" + "-".repeat(40)) })
        }
        character.tasks.forEach(task => {
            // TODO : calculate duration for expiry
            const timeLeft = (task.startTime + (task.duration * this.TIME_UNIT)) - currentTime
            if (timeLeft > 0) {
                const timeLeftReadable = timeLeft === 0 ? 0 : (timeLeft / 1000).toFixed(2)
                socket.emit('output', { msg:
                        chalk.blue(
                            "[time left on task " + task.name + " is "
                            + timeLeftReadable + " " + this.TIME_UNIT_READABLE + "]"
                        )
                });
            } else {
                socket.emit('output', { msg: chalk.green("[task " + task.name + " is complete!]") })
                server.bundles[task.bundle].runTask(task, character, socket)
                task.complete = true
            }
        })
        if (hasTasks) {
            socket.emit('output', { msg: chalk.blue("-".repeat(60)) })
        }
        character.tasks = character.tasks.filter(task => { return task.complete === false })
    },
}