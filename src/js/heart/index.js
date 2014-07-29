var _ = require('lodash');
var when = require('when');
var ko = require('knockout');

var sortable = require('./lib/knockout-sortable');
var Parse = require('parse');

var github = require('./github');

var IssueOrdering = Parse.Object.extend('IssueOrdering', {
    initialize: function(attrs, options) {
        this.set('numbers', []);
    }
});

function Issue(data) {
    this.number = ko.observable();
    this.title = ko.observable();
    this.description = ko.observable();
    this.url = ko.observable();

    this.avatarURL = ko.observable();
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

        this.avatarURL(data.assignee && data.assignee.avatar_url);

        this.milestoneNumber(data.milestone && data.milestone.number);
    },
    save: function() {
        return github.patch(this.url(), {milestone: this.milestoneNumber()});
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
    saveSortOrder: function() {
        var issueNumbers = this.issues().map(function(issue) { return issue.number(); });

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

var model = {
    token: ko.observable(),
    repo: ko.observable(),
    parseAppID: ko.observable(),
    parseKey: ko.observable(),
    fetching: ko.observable(false),
    milestones: ko.observableArray(),
    show: function(el) {
        ko.applyBindings(this, el);
    },
    initParse: function() {
        if (!this.parseAppID() || !this.parseKey()) { return; }

        Parse.initialize(this.parseAppID(), this.parseKey());
    },
    fetchMilestones: function() {
        if (!this.token() || !this.repo() || !this.parseAppID() || !this.parseKey()) {
            console.info('Not loading git♥issues because we don\'t have all the config set', this.repo(), this.token(), this.parseAppID(), this.parseKey());
            return;
        }
        console.log('Fetching milestones for ', this.repo());

        var url = 'repos/' + this.repo() + '/milestones';

        github.get(url)
            .then(function(response) {
                return response.map(function(m) { return new Milestone(m, this.repo()); }, this);
            }.bind(this))
            .tap(this.milestones.bind(undefined))
            .catch(function(e) {
                var msg = 'Could not load milestones for repo ' + this.repo() + ' ' + e.message;
                console.error(msg, e);
                throw Error(msg);
            }.bind(this));
    },
    afterMove: function(options, evt, ui) {
        console.log('Issue moved', options);

        var issue = options.item;
        var source = options.sourceParent();
        var target = options.targetParent();

        if (source !== target) {
            console.log(source, '=>', target);
            var targetMilestone = _.find(this.milestones(), function(m) { return target === m.issues(); });
            if (!targetMilestone) {
                console.error('WTF happened. There\'s no milestone that matches the target', target);
                return;
            }

            console.log('Changing issue', issue.number(), 'to milestone', targetMilestone.title(), targetMilestone.number());

            issue.milestoneNumber(targetMilestone.number()).save();
        }

        this.milestones().forEach(function(milestone) { milestone.saveSortOrder(); });
    }
};

model.token.subscribe(github.initialize.bind(undefined));

model.parseAppID.subscribe(model.initParse.bind(model));
model.parseKey.subscribe(model.initParse.bind(model));

var fetchMilestones = _.debounce(model.fetchMilestones.bind(model), 100);
model.token.subscribe(fetchMilestones);
model.repo.subscribe(fetchMilestones);
model.parseAppID.subscribe(fetchMilestones);
model.parseKey.subscribe(fetchMilestones);

module.exports = model;
