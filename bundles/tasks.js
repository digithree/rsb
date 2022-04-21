const chalk = require("chalk");
module.exports = {
    createTask : function (name) {
        return {
            "name": name
        }
    },

    addTask : function (task, character, socket) {
        const memoryBytes = character.modules.find(el => { return el.name === "Memory"}).current
        const maxTasks = (Math.floor(Math.log(memoryBytes) / Math.log(2))) - 6
        console.log("Max tasks: " + maxTasks)
        if (character.tasks.length >= maxTasks) {
            return {
                added: false,
                msg: chalk.red("Task \"" + task.name + "\" could NOT be started, not enough memory!")
            }
        } else if (character.tasks.find(el => { return el.name === task.name}) !== undefined) {
            return {
                added: false,
                msg: chalk.red("Task \"" + task.name + "\" could NOT be started, this task already active!")
            }
        }
        character.tasks.push(task)
        return {
            added: true,
            msg: chalk.green("Task \"" + task.name + "\" started")
        }
    }
}