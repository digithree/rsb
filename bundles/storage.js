const chalk = require("chalk");
module.exports = {
    storeMaterials : function (materials, character, socket) {
        const storageModule = character.modules.find(module => { return module.name === "Materials storage" })

        if (storageModule === undefined) {
            socket.emit('output', { msg: chalk.red("Materials storage module could not be found, software error!") });
            return;
        }

        let storageLeft = storageModule.max - storageModule.current

        let output = chalk.whiteBright("Storing materials...") + "\n"

        materials.forEach(item => {
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
            } else {
                output += chalk.red(" - can't store " + item.amount + " " + item.type + ", no storage left") + "\n"
            }
            storageModule.current += amountCanStore
            itemStorage.amount += amountCanStore
        })

        storageLeft = storageModule.max - storageModule.current
        output += "\nStorage is now: "
            + (storageLeft > 0 ? chalk.green("" + storageModule.current) : chalk.yellow(storageModule.current))
            + " / " + storageModule.max + "\n"

        socket.emit('output', { msg: output });
    }
}