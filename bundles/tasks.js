module.exports = {
    Task: class {
        constructor() {
            this.name = "No task name"
        }
    },

    addTask : function (task, character, socket) {
        const memoryBytes = character.modules.find(el => { return el.name === "Memory"}).current
        const maxTasks = Math.floor(Math.log(memoryBytes) / Math.log(2))
        console.log("Max tasks: " + maxTasks)
        if (character.tasks.length < maxTasks) {
            character.tasks.push(task)
            return true
        } else {
            return false
        }
    }
}