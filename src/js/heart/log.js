var moment = require('moment');

function output(outputFn) {
    var begin = '[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']';
    var args = [].slice.call(arguments, 1);
    args.unshift(begin);
    outputFn.apply(console, args);
}

console.log = output.bind(undefined, console.log);
console.warn = output.bind(undefined, console.warn);
console.error = output.bind(undefined, console.error);

module.exports = console;
