const chalk = require("chalk");
const tasks = require.main.require("./bundles/tasks.js");

module.exports = {
    storeMaterials : function (materials, character, socket) {
        const batteryModule = character.modules.find(el => { return el.name === "Battery"})
        const storageModule = character.modules.find(module => { return module.name === "Storage" })

        if (batteryModule === undefined) {
            socket.emit('output', { msg: chalk.red("Battery module could not be found, software error!") });
            return;
        }
        if (storageModule === undefined) {
            socket.emit('output', { msg: chalk.red("Storage module could not be found, software error!") });
            return;
        }

        let storageLeft = storageModule.max - storageModule.current

        let output = chalk.whiteBright("Storing...") + "\n"

        let changedBattery = false
        let changedStorage = false

        materials.forEach(item => {
            if (item.type === "NRG") {
                let batteryCapacity = batteryModule.max - batteryModule.current
                if (batteryCapacity <= 0) {
                    output += chalk.red(" - can't store " + item.amount + " " + item.type + ", battery is full") + "\n"
                } else if (batteryCapacity < item.amount) {
                    output += chalk.yellow(" - could not store full amount " + item.amount + " " + item.type
                        + ", storing " + batteryCapacity + " " + item.type) + "\n"
                    batteryModule.current = batteryModule.max
                    changedBattery = true
                } else {
                    output += chalk.greenBright(" - stored " + item.amount + " " + item.type) + "\n"
                    batteryModule.current += item.amount
                    changedBattery = true
                }
            } else {
                storageLeft = storageModule.max - storageModule.current
                if (storageLeft === 0) {
                    output += chalk.red(" - can't store " + item.amount + " " + item.type + ", no storage left") + "\n"
                    return
                }

                let itemStorage = character.storage.find(el => { return el.type === item.type })
                if (itemStorage === undefined) {
                    itemStorage = {
                        "amount": 0,
                        "type": item.type
                    }
                    character.storage.push(itemStorage)
                }
                let newStorage = storageModule.current + item.amount
                let newStorageLeft = storageModule.max - newStorage
                let excess = Math.max(0, newStorageLeft * -1)
                let amountCanStore = item.amount - excess
                if (amountCanStore > 0) {
                    if (excess > 0) {
                        output += chalk.yellow(" - could not store full amount " + item.amount + " " + item.type
                            + ", storing " + amountCanStore + " " + item.type) + "\n"
                    } else {
                        output += chalk.greenBright(" - stored " + item.amount + " " + item.type) + "\n"
                    }
                    changedStorage = true
                } else {
                    output += chalk.red(" - can't store " + item.amount + " " + item.type + ", no storage left") + "\n"
                }
                storageModule.current += amountCanStore
                itemStorage.amount += amountCanStore
            }
        })

        storageLeft = storageModule.max - storageModule.current
        if (changedStorage) {
            output += "\nStorage is now: "
                + (storageLeft > 0 ? chalk.green("" + storageModule.current) : chalk.yellow(storageModule.current))
                + " / " + storageModule.max + (changedBattery ? "\n" : "")
        }
        if (changedBattery) {
            const batteryCapacity = batteryModule.max - batteryModule.current
            output += "\nBattery is now: "
                + (batteryCapacity > 0 ? chalk.green("" + batteryModule.current) : chalk.yellow("" + batteryModule.current))
                + " / " + batteryModule.max
        }

        socket.emit('output', { msg: output });
    }
}