var ko = require('knockout');
var _ = require('lodash');
var when = require('when');
var sequence = require('when/sequence');

var log = require('./log');
var github = require('./github');
var Milestone = require('./Milestone');
var IssueView = require('./IssueView');
var IssuePriority = require('./IssuePriority');

function MilestoneView(data, repo, dataBranch, users) {
    Milestone.call(this, data, repo);

    this.issueViews = ko.observableArray();
    this.originalIssueViews = ko.observableArray();

    this.priorityStorage = new IssuePriority(repo, this.number(), this.title(), dataBranch);
    this.priorities = ko.observableArray();
    this.users = users;
    this.dirty = ko.computed(function() {
        var original = this.originalIssueViews().map(function(view) { return view.number(); });
        var current = this.issueViews().map(function(view) { return view.number(); });

        return !_.isEqual(original, current);
    }.bind(this));

    this.loadIssues();
}

_.extend(MilestoneView.prototype, Milestone.prototype, {
    loadIssues: function() {
        return this.priorityStorage.get()
            .tap(this.priorities.bind(this))
            .then(this.fetchIssues.bind(this))
            .then(function(issueViews) {
                return [issueViews, this.priorities()];
            }.bind(this))
            .spread(this.sortViews.bind(this))
            .tap(this.issueViews.bind(this))
            .done(function(views) {
                this.originalIssueViews(views.slice());
            }.bind(this));
    },
    fetchIssues: function() {
        log.log('Fetching issues for milestone', this.number(), ':', this.title());

        var url = this.url().replace(/milestones\/\d*/g, 'issues');
        var params = {page_page: 100, milestone: this.number()};

        return github.get(url, params)
            .then(function(response) {
                return response.map(function(d) { return new IssueView(d); });
            })
            .catch(function(e) {
                var msg = 'Could not load issues for milestones ' + this.title();
                log.error(msg, e);
                throw new Error(msg);
            }.bind(this));
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

        log.log('Priorities:', issueNumbers);

        return this.priorityStorage.save(issueNumbers)
            .tap(this.priorities.bind(this, issueNumbers));
    },
    removeMilestone: function(issueView) {
        this.issueViews.remove(issueView);
        issueView.milestoneNumber(null);
    },
    showAssignUser: function(issueView) {
        if (issueView.assignUserVisible()) {
            issueView.assignUserVisible(false);
            return;
        }

        this.issueViews().forEach(function(view) {
            view.assignUserVisible(view === issueView);
        });
    },
    save: function() {
        var newIssues = this.issueViews().filter(function(view) { return view.milestoneNumber() !== this.number(); }.bind(this));
        var deletedIssues = this.originalIssueViews().filter(function(view) { return !view.milestoneNumber(); });

        log.log('Save info for', this.title(), '=========================');
        newIssues.forEach(function(view) { view.milestoneNumber(this.number()); }.bind(this));

        return when.try(function() {
                log.log('New issues:', newIssues);
                return sequence(newIssues.map(function(view) { return view.save.bind(view); }));
            })
            .tap(function() {
                log.log('Deleted issues:', deletedIssues);
                return sequence(deletedIssues.map(function(view) { return view.save.bind(view); }));
            })
            .tap(function() {
                return this.savePriorities();
            }.bind(this))
            .then(function() {
                this.originalIssueViews(this.issueViews().slice());

                log.log('============================');
                return [newIssues, deletedIssues];
            }.bind(this));
    },
    revert: function() {
        var sorted = this.sortViews(this.originalIssueViews(), this.priorities());
        this.issueViews(sorted);
    }
});

module.exports = MilestoneView;
