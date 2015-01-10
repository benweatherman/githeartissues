var _ = require('lodash');
var moment = require('moment');

var log = console.log;
console.log = function() {
    var begin = _.template('[<%= now %>]', {now: moment().format('YYYY-MM-DD HH:mm:ss')});
    log.apply(console, [begin].concat([].slice.apply(arguments)));
};

module.exports = console;
