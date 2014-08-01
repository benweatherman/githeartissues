var ko = require('knockout');
var _ = require('lodash');

var Issue = require('./Issue');

function IssueView() {
    Issue.apply(this, arguments);

    this.assignUserVisible = ko.observable();
}

_.extend(IssueView.prototype, Issue.prototype, {
    assignUser: function(user) {
        console.log('ASSigning', user, '=>', this);
        this.assignee(user);

        this.save()
            .tap(this.assignUserVisible.bind(undefined, false))
            .catch(console.error.bind(console));
    }
});

_.extend(IssueView, {
    createFromIssue: function(issue) {
        return new IssueView(issue.data);
    }
});

module.exports = IssueView;
