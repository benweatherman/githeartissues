var ko = require('knockout');
var _ = require('lodash');

var log = require('./log');
var Issue = require('./Issue');

function IssueView() {
    Issue.apply(this, arguments);

    this.assignUserVisible = ko.observable();
}

_.extend(IssueView.prototype, Issue.prototype, {
    assignUser: function(user) {
        log.log('ASSigning', user, '=>', this);
        this.assignee(user);

        this.save()
            .tap(this.assignUserVisible.bind(undefined, false))
            .catch(log.error.bind(log));
    },
    removeUser: function(user) {
        log.log('unASSigning', user, '=>', this);
        this.assignee(null);

        this.save()
            .tap(this.assignUserVisible.bind(undefined, false))
            .catch(log.error.bind(log));
    }
});

_.extend(IssueView, {
    clone: function(issue) {
        return new IssueView(issue.data);
    }
});

module.exports = IssueView;
