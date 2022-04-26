const chalk = require("chalk");
const Table = require("cli-table");
const server = require.main.require('./bundles/server.js');
const energy = require.main.require('./bundles/energy.js');
const storage = require.main.require("./bundles/storage.js");
const tasksUtils = require.main.require("./bundles/tasks-utils.js");

module.exports = {
    "TIME_UNIT": 1000, // 1 sec
    "TIME_UNIT_READABLE": "sec", // 1 sec

    createTask : function (name, moduleName, bundle, duration, costs, output, payload = {}) {
        return {
            "name": name,
            "moduleName": moduleName,
            "bundle": bundle,
            "startTime": (new Date()).getTime(),
            "duration": duration,
            "costs": costs,
            "output": output,
            "payload": payload,
            "complete": false
        }
    },

    createTaskWithAction : function (name, moduleName, bundle, action, payload = {}) {
        return {
            "name": name,
            "moduleName": moduleName,
            "bundle": bundle,
            "startTime": (new Date()).getTime(),
            "duration": action.duration,
            "costs": action.costs,
            "output": action.output,
            "payload": payload,
            "complete": false
        }
    },

    addTask : function (task, character, socket) {
        const memoryBytes = character.modules.find(el => { return el.name === "Memory"}).current

        // storage modules
        const batteryModule = character.modules.find(el => { return el.name === "Battery"})
        const storageModule = character.modules.find(el => { return el.name === "Storage"})

        tasksUtils.printCosts(
            "\"" + task.name + "\" " +
                chalk.yellowBright("duration " + task.duration + " " + this.TIME_UNIT_READABLE) +
                ", costs",
            task.costs,
            socket
        )

        let result = {
            added: true,
            msg: chalk.green("Task \"" + task.name + "\" added to queue")
        }
        let failedResultText = ""

        //validate costs
        let costAfforded = true
        task.costs.forEach(item => {
            if (item.type === "NRG") {
                // use battery
                const energyStats = energy.energyStats(character)

                const energyDiff = energyStats.netEnergy - item.amount
                const batteryRemaining = batteryModule.current + energyDiff
                if (batteryRemaining < 0) {
                    costAfforded = false
                    failedResultText += chalk.red(
                        "\n\t- not enough NRG (need " + (batteryRemaining * -1) + ")"
                    )
                }
            } else {
                // in Storage
                const materialStored = character.storage.find(stored => { return item.type === stored.type })

                if (materialStored === undefined) {
                    costAfforded = false
                    failedResultText += chalk.red(
                        "\n\t- not enough " + item.type + " (need " + item.amount + ")"
                    )
                } else if (materialStored.amount - item.amount < 0) {
                    costAfforded = false
                    failedResultText += chalk.red(
                        "\n\t- not enough " + item.type + " (need " + ((materialStored.amount - item.amount) * -1) + ")"
                    )
                }
            }
        })

        // check enough room to store any gathered or processed materials, only if there are no additional tasks queued
        let hasStorageSpace = true
        if (character.tasks.length === 0) {
            let storageTracking = storageModule.current
            task.output.forEach(item => {
                if (item.type === "NRG") {
                    // adding to battery
                    if (batteryModule.current === batteryModule.max) {
                        hasStorageSpace = false
                        failedResultText += chalk.red(
                            "\n\t- battery does not need NRG, is full"
                        )
                    }
                } else {
                    // in Storage
                    storageTracking += item.amount

                    if (storageTracking > storageModule.max) {
                        hasStorageSpace = false
                        failedResultText += chalk.red(
                            "\n\t- not enough storage space for " + item.amount + " " + item.type
                        )
                    }
                }
            })
        }

        if (costAfforded && hasStorageSpace) {
            const maxTasks = (Math.floor(Math.log(memoryBytes) / Math.log(2))) - 6
            if (character.tasks.length >= maxTasks) {
                result = {
                    added: false,
                    msg: chalk.red("Task \"" + task.name + "\" could NOT be queued, not enough memory!")
                }
            }
        } else {
            result = {
                added: false,
                msg: chalk.whiteBright("Task \"" + task.name + "\" could NOT be queued:") + failedResultText
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
            // adjust start time if will be queued
            if (character.tasks.length > 0) {
                const lastTask = character.tasks[character.tasks.length - 1]
                task.startTime = lastTask.startTime + (lastTask.duration * this.TIME_UNIT)
            }
            // add task to queue
            character.tasks.push(task)
            this.processTasks(character, socket)
        }
        return result.added
    },

    completedTasksCount : function (character, currentTime = (new Date()).getTime()) {
        let count = 0
        for (let taskIndex = 0; taskIndex < character.tasks.length; taskIndex++) {
            const task = character.tasks[taskIndex]
            const leftOverTime = currentTime - task.startTime
            const taskDuration = (task.duration * this.TIME_UNIT)
            if (leftOverTime - taskDuration >= 0) {
                count++
            }
        }
        return count
    },

    processTasks : function (character, socket, currentTime = (new Date()).getTime()) {
        if (character === null) return // character not set up yet
        if (character.tasks.length > 0) {
            let displayStorageAfter = false
            socket.emit('output', { msg: chalk.blue("-".repeat(5) + "TASKS QUEUE" + "-".repeat(40)) })
            let output = ""
            for (let taskIndex = 0; taskIndex < character.tasks.length; taskIndex++) {
                const task = character.tasks[taskIndex]
                const leftOverTime = currentTime - task.startTime
                const taskDuration = (task.duration * this.TIME_UNIT)
                if (leftOverTime - taskDuration >= 0) {
                    // task is complete
                    output += chalk.green("[task " + task.name + " is complete]\n")
                    // then store materials, if any
                    if (task.output.length > 0) {
                        storage.storeMaterials(task.output, character, socket)
                        displayStorageAfter = true
                    }
                    // run specific task function
                    server.bundles[task.bundle].runTask(task, character, socket)
                    task.complete = true
                } else {
                    // not enough time for task
                    let isFirstNotCompleteTask = true
                    for (let i = 0; i < taskIndex; i++) {
                        if (!character.tasks[i].complete) {
                            isFirstNotCompleteTask = false
                            break
                        }
                    }
                    if (isFirstNotCompleteTask) {
                        const timeLeft = (leftOverTime - taskDuration) * -1
                        const timeLeftReadable = timeLeft === 0 ? 0 : (timeLeft / 1000).toFixed(2)
                        output += chalk.blue(
                            "[time left on task " + task.name + " is "
                            + timeLeftReadable + " " + this.TIME_UNIT_READABLE + "]\n"
                        )
                    } else {
                        output += chalk.gray("[queued task " + task.name + "]\n")
                    }
                }
            }
            socket.emit('output', { msg: output })
            character.tasks = character.tasks.filter(task => { return task.complete === false })
            if (displayStorageAfter) {
                storage.printResources(character, socket)
            }
        }
        if (character.tasks.length > 0) {
            socket.emit('tasks', {
                "tasks": character.tasks.map(task => {
                    return {
                        "name": task.name,
                        "timeLeft": (currentTime - (task.startTime + (task.duration * this.TIME_UNIT))) * -1
                    }
                })
            })
        } else {
            socket.emit('tasks', { "tasks": [] })
        }
    },
}