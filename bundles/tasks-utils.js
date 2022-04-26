const Table = require("cli-table");
const chalk = require("chalk");

module.exports = {
    printCosts : function (title, costs, socket) {
        let output = title + ":"
        if (costs.length > 0) {
            output += "\n" + this.getCostsTable(costs).toString()
        } else {
            output += " Free"
        }
        socket.emit('output', {msg: output })
    },

    getCostsTable : function (costs) {
        const table = new Table({
            head: [
                chalk.whiteBright.bold("AMT"),
                chalk.whiteBright.bold("TYPE"),
            ],
            colWidths: [6, 6],
            chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
        });
        costs.forEach(cost => {
            table.push([chalk.white(cost.type), chalk.yellowBright(cost.amount)])
        })
        return table.toString()
    },
}