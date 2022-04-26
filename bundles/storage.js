const chalk = require("chalk");
const Table = require("cli-table");
const utils = require.main.require("./bundles/utils.js");
const energy = require.main.require('./bundles/energy.js');
const tasksUtils = require.main.require("./bundles/tasks-utils.js");

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

        if (output.slice(-1) === "\n") {
            output = output.substring(0, output.length - 1)
        }

        socket.emit('output', { msg: output });
    },

    printResources : function (character, socket) {
        const batteryModule = character.modules.find(el => { return el.name === "Battery"})
        const storageModule = character.modules.find(el => { return el.name === "Storage"})
        const energyStats = energy.energyStats(character)

        let output = "Resources:\n"

        const table = new Table({
            colWidths: [20, 17],
            chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
        });
        const namePadWidth = 18

        let col = utils.colors.green
        if (energyStats.battery < batteryModule.warningBelow) {
            col = utils.colors.orange
        } else if (energyStats.battery < 0) {
            col = utils.colors.red
        }
        let colText = chalk.hex(col);
        table.push(
            [
                utils.padGrayDots("Battery", namePadWidth, chalk.white),
                colText(energyStats.battery + " / " + batteryModule.max)
            ]
        )

        col = utils.colors.green
        if (energyStats.netEnergy === 0) {
            col = utils.colors.orange
        } else if (energyStats.netEnergy < 0) {
            col = utils.colors.red
        }
        colText = chalk.hex(col)
        table.push(
            [utils.padGrayDots("Net energy", namePadWidth, chalk.white), colText(energyStats.netEnergy)]
        )

        col = utils.colors.green
        if (storageModule.current === storageModule.max) {
            col = utils.colors.red
        } else if (storageModule.current > storageModule.warningAbove) {
            col = utils.colors.orange
        }
        colText = chalk.hex(col)
        table.push(
            [
                utils.padGrayDots("Storage", namePadWidth, chalk.white),
                colText(storageModule.current + " / " + storageModule.max) +
                (character.storage.length > 0 ? ("\n" + tasksUtils.getCostsTable(character.storage)) : "")
            ]
        )

        output += table.toString() + "\n"

        if (energyStats.netEnergy >= 0) {
            output += chalk.green('Positive net energy: battery will not deplete')
        } else {
            output += chalk.hex(utils.colors.orange)('NEGATIVE net energy: battery WILL deplete')
        }

        socket.emit('output', { msg: output });
    }
}