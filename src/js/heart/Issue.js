var ko = require('knockout');
var _ = require('lodash');
var github = require('./github');

var User = require('./User');

function Issue(data) {
    this.number = ko.observable();
    this.title = ko.observable();
    this.description = ko.observable();
    this.url = ko.observable();
    this.htmlURL = ko.observable();

    this.assignee = ko.observable();
    this.milestoneNumber = ko.observable();

    this.load(data);
}

_.extend(Issue.prototype, {
    load: function(data) {
        this.data = data;

        this.number(data.number);
        this.title(data.title);
        this.description(data.description);
        this.url(data.url);
        this.htmlURL(data.html_url);

        if (data.assignee) {
            this.assignee(new User(data.assignee));
        }

        this.milestoneNumber(data.milestone && data.milestone.number);
    },
    save: function() {
        var d = {
            milestone: this.milestoneNumber(),
            assignee: this.assignee() && this.assignee().login()
        };

        return github.patch(this.url(), d);
    }
});

module.exports = Issue;
