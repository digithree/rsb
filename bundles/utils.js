const chalk = require("chalk");

module.exports = {
    "colors": {
        "red": "#FF0000",
        "green": "#00FF00",
        "orange": "#FF9933",
        "blue": "#0000FF",
        "magenta": "#FF00FF",
        "cyan": "#00FFFF",
        "white": "#FFFFFF"
    },

    "wrap": (s, w) => s.replace(
        new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n'
    ),

    "padGrayDots": (s, w, colFn = (s) => {return s}) => (w - s.length) > 0 ?
        colFn(s) + chalk.gray(".".repeat(w - s.length))
        : colFn(s)
}