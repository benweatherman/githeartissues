var ko = require('knockout');
var _ = require('lodash');

var log = require('./log');
var Milestone = require('./Milestone');
var IssueView = require('./IssueView');
var IssuePriority = require('./IssuePriority');

var DEFAULT_SAVE_DELAY = 15000;

function MilestoneView(data, repo, dataBranch) {
    Milestone.call(this, data, repo);

    this.issueViews = ko.observableArray();
    // Subscribe to a change rather than making it a computed because the drag/drop stuff doesn't like computeds
    this.issues.subscribe(this.createViews, this);

    this.priorities = new IssuePriority(repo, this.number(), this.title(), dataBranch);
}

_.extend(MilestoneView.prototype, Milestone.prototype, {
    createViews: function(issues) {
        var views = issues.map(function(issue) { return IssueView.clone(issue); });

        this.priorities.get()
            .then(this.sortViews.bind(this, views))
            .done(this.issueViews.bind(this));
    },
    sortViews: function(issueViews, issueNumbers) {
        var remainingIssueNumbers = issueViews.map(function(view) { return view.number(); });
        var sortedIssues = [];

        var issuesByNumber = {};
        issueViews.forEach(function(view) {
            issuesByNumber[view.number()] = view;
        });

        issueNumbers.forEach(function(issueNumber) {
            var issue = issuesByNumber[issueNumber];
            if (issue) {
                sortedIssues.push(issue);
                delete remainingIssueNumbers[remainingIssueNumbers.indexOf(issue.number())];
            }
        }.bind(this));

        remainingIssueNumbers.forEach(function(number) {
            var issue = issuesByNumber[number];
            if (issue) {
                sortedIssues.push(issue);
            }
        });

        return sortedIssues;
    },
    savePriorities: function() {
        var issueNumbers = this.issueViews().map(function(issue) { return issue.number(); });

        log.info('Saving issue ordering for milestone', this.number(), this.title(), ':', issueNumbers);

        return this.priorities.save(issueNumbers);
    },
    removeMilestone: function(issueView) {
        this.issueViews.remove(issueView);
        return issueView.milestoneNumber('').save()
            .then(this.savePriorities.bind(this));
    }
});

module.exports = MilestoneView;
