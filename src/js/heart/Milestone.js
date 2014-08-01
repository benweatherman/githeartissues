var ko = require('knockout');
var _ = require('lodash');
var when = require('when');
var Parse = require('parse');
var github = require('./github');

var Issue = require('./Issue');

var IssueOrdering = Parse.Object.extend('IssueOrdering', {
    initialize: function(attrs, options) {
        this.set('numbers', []);
    }
});

function Milestone(data, repo) {
    this.repo = repo;

    this.number = ko.observable();
    this.title = ko.observable();
    this.description = ko.observable();
    this.issues = ko.observableArray();

    this.load(data);

    this.issueOrdering = null;
    this.defaultIssueOrderingVals = {milestone: this.number(), repo: repo};

    var query = new Parse.Query(IssueOrdering);
    this.query = query.equalTo('milestone', this.number()).equalTo('repo', repo);
}

_.extend(Milestone.prototype, {
    load: function(data) {
        this.data = data;

        this.number(data.number);
        this.title(data.title);
        this.description(data.description);

        this.fetchIssues();
    },
    getParseObject: function() {
        if (this.issueOrdering) { return when.resolve(this.issueOrdering); }

        return this.query.first()
                    .then(function(response) {
                        this.issueOrdering = response ? response : new IssueOrdering(this.defaultIssueOrderingVals);

                        return this.issueOrdering;
                    }.bind(this));
    },
    saveSortOrder: function(issues) {
        var issueNumbers = issues.map(function(issue) { return issue.number(); });

        console.log('Saving issue ordering for milestone', this.number(), this.title(), ':', issueNumbers);

        return this.getParseObject()
                    .then(function() {
                        this.issueOrdering.set('numbers', issueNumbers);
                        return this.issueOrdering.save();
                    }.bind(this));
    },
    sortIssues: function(issues) {
        var remainingIssueNumbers = issues.map(function(issue) { return issue.number(); });
        var sortedIssues = [];

        var issuesByNumber = {};
        issues.forEach(function(issue) {
            issuesByNumber[issue.number()] = issue;
        });

        return this.getIssueSort()
            .then(function(issueSort) {
                console.log('Sorting', this.title(), 'issues with', issueSort);
                issueSort.forEach(function(number) {
                    var issue = issuesByNumber[number];
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
            }.bind(this));
    },
    getIssueSort: function() {
        return this.getParseObject()
            .then(function(parseIssueOrderingObj) {
                return parseIssueOrderingObj.get('numbers');
            });
    },
    fetchIssues: function() {
        console.log('Fetching issues for milestone', this.number(), ':', this.title());

        var url = 'repos/' + this.repo + '/issues';
        var params = {page_page: 100, milestone: this.number()};

        return github.get(url, params)
                    .then(function(response) {
                        return response.map(function(d) { return new Issue(d); }, this);
                    }.bind(this))
                    .then(this.sortIssues.bind(this))
                    .tap(this.issues.bind(this))
                    .catch(function(e) {
                        var msg = 'Could not load issues for milestones ' + this.title();
                        console.error(msg, e);
                        throw Error(msg);
                    }.bind(this));
    }
});

module.exports = Milestone;
