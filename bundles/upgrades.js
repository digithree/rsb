const chalk = require("chalk");

module.exports = {
    createUpgradeTaskPayload : function (moduleName, newLevel) {
        return {
            "moduleName": moduleName,
            "newLevel": newLevel
        }
    },

    applyUpgrade : function (moduleName, newLevel, character, socket) {
        const module = character.modules.find(el => { return el.name.toLowerCase() === moduleName.toLocaleString()})

        if (module === undefined) {
            socket.emit('output', { msg: chalk.red("Cannot apply upgrade to module \"" + arguments + "\", module not found") })
        } else {
            const upgradeSpecItem = module.upgradeSpec.find(spec => { return spec.level === newLevel })

            if (upgradeSpecItem === undefined) {
                socket.emit('output', { msg:
                        chalk.red("Cannot apply upgrade to module \"" + arguments + "\", level "
                            + newLevel + " spec not found")
                })
            } else {
                // apply each change from the upgrade spec to the module
                for (const key in upgradeSpecItem.changes) {
                    module[key] = upgradeSpecItem.changes[key]
                }
                module.level = newLevel
                socket.emit('output', {msg: chalk.green("Module \"" + moduleName + "\" is upgraded to level " + newLevel)})
            }
        }
    }
}