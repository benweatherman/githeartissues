var ko = require('knockout');
var _ = require('lodash');
var when = require('when');
var sequence = require('when/sequence');

var log = require('./log');
var github = require('./github');
var Milestone = require('./Milestone');
var IssueView = require('./IssueView');

function MilestoneView(data, users, storage) {
    Milestone.call(this, data);

    this.issueViews = ko.observableArray();
    this.originalIssueViews = ko.observableArray();

    this.issueStorage = storage;
    this.sortOrder = ko.observableArray();
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
        return this.issueStorage.getSortOrder(this)
            .tap(this.sortOrder.bind(this))
            .then(this.fetchIssues.bind(this))
            .then(function(issueViews) {
                return [issueViews, this.sortOrder()];
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
    sortViews: function(issueViews, sortOrder) {
        var remainingIssueNumbers = issueViews.map(function(view) { return view.number(); });
        var sortedIssues = [];

        var issuesByNumber = {};
        issueViews.forEach(function(view) {
            issuesByNumber[view.number()] = view;
        });

        sortOrder.forEach(function(issueNumber) {
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
    saveSortOrder: function() {
        return this.issueStorage.saveSortOrder(this, this.issueViews())
            .tap(this.sortOrder.bind(this))
            .tap(log.log.bind(log, 'Sort order:'));
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

        log.log('============================');
        log.log('Save info for', this.title());
        newIssues.forEach(function(view) { view.milestoneNumber(this.number()); }.bind(this));

        return when.try(function() {
                log.log('New issues:', newIssues);
                return sequence(newIssues.map(function(view) { return view.save.bind(view); }));
            })
            .tap(function() {
                log.log('Deleted issues:', deletedIssues);
                return sequence(deletedIssues.map(function(view) { return view.save.bind(view); }));
            })
            .tap(this.saveSortOrder.bind(this))
            .then(function() {
                this.originalIssueViews(this.issueViews().slice());

                log.log('============================');
                return [newIssues, deletedIssues];
            }.bind(this));
    },
    revert: function() {
        var sorted = this.sortViews(this.originalIssueViews(), this.sortOrder());
        this.issueViews(sorted);
    }
});

module.exports = MilestoneView;
