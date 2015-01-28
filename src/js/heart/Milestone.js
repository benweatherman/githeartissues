var ko = require('knockout');
var _ = require('lodash');

var log = require('./log');
var Issue = require('./Issue');

function Milestone(data) {
    this.number = ko.observable();
    this.title = ko.observable();
    this.description = ko.observable();
    this.issues = ko.observableArray();
    this.url = ko.observable();
    this.clickableURL = ko.observable();

    this.load(data);
}

_.extend(Milestone.prototype, {
    load: function(data) {
        log.log('Loading milestone data', data);

        this.data = data;

        this.number(data.number);
        this.title(data.title);
        this.description(data.description);
        this.url(data.url);
        // Turn https://api.github.com/repos/ordoro/ordoro/milestones/55 => https://github.com/ordoro/ordoro/milestones/i-am-your-issue
        this.clickableURL(data.url.replace(/api\.|repos\//g, '').replace(data.number, data.title));
    }
});

module.exports = Milestone;
