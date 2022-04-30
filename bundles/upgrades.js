const chalk = require("chalk");

module.exports = {
    createUpgradeTaskPayload : function (moduleName, newLevel) {
        return {
            "moduleName": moduleName,
            "newLevel": newLevel
        }
    },

    applyUpgrade : function (moduleName, newLevel, character, socket) {
        const module = character.modules.find(el => { return el.name.toLowerCase() === moduleName.toLowerCase()})
        const upgradeSpecs = this.specs.find(el => { return el.name.toLowerCase() === moduleName.toLowerCase()})

        if (module === undefined) {
            socket.emit('output', { msg: chalk.red("Cannot apply upgrade to module \"" + moduleName + "\", module not found") })
        } else {
            const upgradeSpecItem = upgradeSpecs.levels.find(spec => { return spec.level === newLevel })

            if (upgradeSpecItem === undefined) {
                socket.emit('output', { msg:
                        chalk.red("Cannot apply upgrade to module \"" + moduleName + "\", level "
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
    },

    "specs": [
        {
            "name": "Radar",
            "levels": [
                {
                    "level": 1,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 60
                        },
                        {
                            type: "MET",
                            amount: 10
                        },
                        {
                            type: "SIL",
                            amount: 55
                        }
                    ],
                    "duration": 100,
                    "changes": {
                        "status": "Operational",
                        // TODO : add actions
                        //"actions": ["scan-local"]
                    }
                }
            ],
        },
        {
            "name": "SOS Eye",
            "levels": [
                {
                    "level": 1,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 80
                        },
                        {
                            type: "MET",
                            amount: 60
                        },
                        {
                            type: "SIL",
                            amount: 120
                        }
                    ],
                    "duration": 400,
                    "changes": {
                        "status": "Operational",
                        // TODO : add actions
                        //"actions": ["scan-far"],
                    }
                }
            ],
        },
        {
            "name": "Memory",
            "levels": [
                {
                    "level": 2,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 30
                        },
                        {
                            type: "MET",
                            amount: 5
                        },
                        {
                            type: "SIL",
                            amount: 30
                        }
                    ],
                    "duration": 20,
                    "changes": {
                        "current": 256,
                        "energy": 4
                    }
                }
                // TODO : more levels
            ],
        },
        {
            "name": "Legs",
            "levels": [
                {
                    "level": 1,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 50
                        },
                        {
                            type: "MET",
                            amount: 140
                        },
                        {
                            type: "SIL",
                            amount: 30
                        }
                    ],
                    "duration": 250,
                    "changes": {
                        "status": "Operational",
                        // TODO : add actions
                        //"actions": ["crawl", "push", "latch"],
                    }
                }
            ],
        },
        {
            "name": "Storage",
            "levels": [
                {
                    "level": 2,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 15
                        },
                        {
                            type: "MET",
                            amount: 10
                        },
                        {
                            type: "SIL",
                            amount: 5
                        }
                    ],
                    "duration": 15,
                    "changes": {
                        "max": 80,
                        "warningAbove": 70
                    }
                },
                {
                    "level": 3,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 30
                        },
                        {
                            type: "MET",
                            amount: 40
                        },
                        {
                            type: "SIL",
                            amount: 25
                        }
                    ],
                    "duration": 25,
                    "changes": {
                        "max": 200,
                        "warningAbove": 180
                    }
                }
            ],
        },
        {
            "name": "Solar panel",
            "levels": [
                {
                    "level": 2,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 15
                        },
                        {
                            type: "MET",
                            amount: 30
                        },
                        {
                            type: "SIL",
                            amount: 30
                        }
                    ],
                    "duration": 20,
                    "changes": {
                        "status": "Some panel damage",
                        "yield": 18,
                        "actions": [
                            {
                                "name": "charge",
                                "showCosts": true,
                                "costs": [],
                                "duration": 5,
                                "output": [
                                    {
                                        "type": "NRG",
                                        "amount": 18
                                    }
                                ]
                            }
                        ],
                    }
                },
                {
                    "level": 3,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 50
                        },
                        {
                            type: "MET",
                            amount: 70
                        },
                        {
                            type: "SIL",
                            amount: 70
                        }
                    ],
                    "changes": {
                        "status": "Operational",
                        "yield": 40,
                        "actions": [
                            {
                                "name": "charge",
                                "showCosts": true,
                                "costs": [],
                                "duration": 7,
                                "output": [
                                    {
                                        "type": "NRG",
                                        "amount": 40
                                    }
                                ]
                            }
                        ],
                    }
                }
            ],
        },
        {
            "name": "Battery",
            "levels": [
                {
                    "level": 2,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 15
                        },
                        {
                            type: "MET",
                            amount: 5
                        },
                        {
                            type: "SIL",
                            amount: 30
                        }
                    ],
                    "duration": 40,
                    "changes": {
                        "status": "Low capacity",
                        "max": 50,
                        "warningBelow": 20
                    }
                },
                {
                    "level": 3,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 50
                        },
                        {
                            type: "MET",
                            amount: 15
                        },
                        {
                            type: "SIL",
                            amount: 50
                        }
                    ],
                    "duration": 80,
                    "changes": {
                        "status": "Moderate capacity",
                        "max": 90,
                        "warningBelow": 30
                    }
                }
            ],
        },
        {
            "name": "Ion Engine",
            "levels": [
                {
                    "level": 1,
                    "costs": [
                        {
                            type: "NRG",
                            amount: 200
                        },
                        {
                            type: "MET",
                            amount: 400
                        },
                        {
                            type: "SIL",
                            amount: 250
                        }
                    ],
                    "duration": 900,
                    "changes": {
                        "status": "Operational",
                        // TODO : add actions later
                        //"actions": ["fly"],
                    }
                }
            ],
        }
    ]

}