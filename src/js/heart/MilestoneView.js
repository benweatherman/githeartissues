var ko = require('knockout');
var _ = require('lodash');

var Milestone = require('./Milestone');
var IssueView = require('./IssueView');

function MilestoneView() {
    Milestone.apply(this, arguments);

    this.issueViews = ko.observableArray();
    // Subscribe to a change rather than making it a computed because the drag/drop stuff doesn't like computeds
    this.issues.subscribe(this.createViews, this);
}

_.extend(MilestoneView.prototype, Milestone.prototype, {
    createViews: function(issues) {
        var views = issues.map(function(issue) { return IssueView.createFromIssue(issue); });
        this.issueViews(views);

        return this.issueViews();
    }
});

module.exports = MilestoneView;
