const chalk = require("chalk");
const server = require.main.require('./bundles/server.js');
const energy = require.main.require('./bundles/energy.js');
const storage = require.main.require("./bundles/storage.js");

module.exports = {
    "TIME_UNIT": 1000, // 1 sec
    "TIME_UNIT_READABLE": "sec", // 1 sec

    createTask : function (name, level, bundle, moduleName, duration, costs, output, payload = {}) {
        return {
            "name": name,
            "level": level,
            "bundle": bundle,
            "moduleName": moduleName,
            "startTime": (new Date()).getTime(),
            "duration": duration,
            "costs": costs,
            "output": output,
            "payload": payload,
            "complete": false
        }
    },

    addTask : function (task, character, socket) {
        const memoryBytes = character.modules.find(el => { return el.name === "Memory"}).current

        // storage modules
        const batteryModule = character.modules.find(el => { return el.name === "Battery"})
        const storageModule = character.modules.find(el => { return el.name === "Storage"})

        let result = {
            added: true,
            msg: chalk.green("Task \"" + task.name + "\" started")
        }

        //validate costs
        let costAfforded = true
        task.costs.forEach(item => {
            if (!costAfforded) return
            if (item.type === "NRG") {
                // use battery
                const energyStats = energy.energyStats(character)

                const energyDiff = energyStats.netEnergy - item.amount
                const batteryRemaining = batteryModule.current + energyDiff
                if (batteryRemaining < 0) {
                    costAfforded = false
                    result = {
                        added: false,
                        msg: chalk.red("Task \"" + task.name + "\" could NOT be started, not enough NRG (need "
                            + (batteryRemaining * -1) + ")")
                    }
                }
            } else {
                // in Storage
                const materialStored = character.storage.find(stored => { return item.type === stored.type })

                if (materialStored === undefined) {
                    costAfforded = false
                    result = {
                        added: false,
                        msg: chalk.red("Task \"" + task.name + "\" could NOT be started, not enough " + item.type
                            + " (need " + item.amount + ")")
                    }
                } else if (materialStored.amount - item.amount < 0) {
                    costAfforded = false
                    result = {
                        added: false,
                        msg: chalk.red("Task \"" + task.name + "\" could NOT be started, not enough " + item.type
                            + " (need " + ((materialStored.amount - item.amount) * -1) + ")")
                    }
                }
            }
        })
        // TODO : check enough room to store any gathered or processed materials

        if (costAfforded) {
            const maxTasks = (Math.floor(Math.log(memoryBytes) / Math.log(2))) - 6
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
        }

        socket.emit('output', { msg: result.msg });
        if (result.added) {
            // apply costs
            let storageNetReduce = 0
            task.costs.forEach(item => {
                if (item.type === "NRG") {
                    // use battery
                    const energyStats = energy.energyStats(character)
                    const energyDiff = energyStats.netEnergy - item.amount
                    batteryModule.current += energyDiff
                } else {
                    // in Storage
                    const materialStored = character.storage.find(stored => { return item.type === stored.type })
                    materialStored.amount -= item.amount
                    storageNetReduce += item.amount
                }
            })
            storageModule.current -= storageNetReduce
            // add task to queue
            character.tasks.push(task)
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
                // then store materials, if any
                if (task.output.length > 0) {
                    storage.storeMaterials(task.output, character, socket)
                }
                server.bundles[task.bundle].runTask(task, character, socket)
                task.complete = true
            }
        })
        character.tasks = character.tasks.filter(task => { return task.complete === false })
    },
}