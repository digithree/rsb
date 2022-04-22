module.exports = {
    energyStats : function (character) {
        const energy = {
            "netEnergy": 0,
            "battery": 0
        }

        character.modules.forEach(module => {
            const isTaskActive = character.tasks.find(task => { return task.moduleName === module.name }) !== undefined
            const permType = module.type === "perm"

            if ((isTaskActive || permType) && !module.error && module.yieldType === "NRG") {
                energy.netEnergy += module.yield
            } else if ((isTaskActive || permType) && !module.error && module.energy > 0) {
                energy.netEnergy -= module.energy
            }
        })

        const batteryModule = character.modules.find(el => { return el.name === "Battery"})
        energy.battery = batteryModule.current

        return energy
    }
}