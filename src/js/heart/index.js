var fs = require('fs');
var _ = require('lodash');
var when = require('when');
var sequence = require('when/sequence');
var ko = require('knockout');

var _koSortable = require('./lib/knockout-sortable');
var _koStringTemplate = require('./lib/knockout-string-template');

var github = require('./github');

var log = require('./log');
var MilestoneView = require('./MilestoneView');
var IssueView = require('./IssueView');
var User = require('./User');
var CredentialsDialog = require('./credentials/CredentialsDialog');

function Heart() {
    this.template = fs.readFileSync(__dirname + '/index.html', 'utf8');
    this.token = ko.observable();
    this.repo = ko.observable();
    this.branch = ko.observable();
    this.milestones = ko.observableArray();
    this.allIssues = ko.observableArray();
    this.allIssuesSearch = ko.observable('type:issues no:milestone state:open');
    this.allIssuesVisible = ko.observable(JSON.parse(localStorage.getItem('allIssuesVisible')));
    this.allIssuesVisible.subscribe(localStorage.setItem.bind(localStorage, 'allIssuesVisible'));
    this.users = ko.observableArray();
    this.credentialsDialog = new CredentialsDialog();

    this.isConfigured = ko.computed(function() { return this.token() && this.token().length && this.repo() && this.repo().length; }, this);

    this.token.subscribe(github.initialize.bind(undefined));

    this.repo.subscribe(this.updateRepoInSearch, this);

    this.allIssuesSearch.subscribe(this.fetchAllIssues, this);
}

_.extend(Heart.prototype, {
    github: github,
    start: function(el) {
        this.loadConfig();
        if (this.isConfigured()) {
            this.loadData();
        }
        else {
            this.openCredentialsDialog();
        }

        ko.applyBindings(this, el);
    },
    loadData: function() {
        log.log('Fetching milestones for ', this.repo());

        this.milestones.removeAll();

        github.get('repos/' + this.repo() + '/milestones')
            .then(function(response) {
                return response.map(function(m) { return new MilestoneView(m, this.repo(), this.branch()); }, this);
            }.bind(this))
            .tap(this.milestones.bind(this))
            .catch(function(e) {
                var msg = 'Could not load milestones for repo ' + this.repo() + ' ' + e.message;
                log.error(msg, e);
                throw Error(msg);
            }.bind(this));

        github.get('repos/' + this.repo() + '/assignees')
            .then(function(response) {
                return response.map(function(u) { return new User(u); });
            })
            .tap(this.users.bind(this))
            .catch(function(e) {
                var msg = 'Could not load users for repo ' + this.repo() + ' ' + e.message;
                log.error(msg, e);
                throw Error(msg);
            }.bind(this));
    },
    loadConfig: function() {
        this.token(this.credentialsDialog.token());
        this.repo(this.credentialsDialog.repo());
        this.branch(this.credentialsDialog.branch());
    },
    fetchAllIssues: _.debounce(function() {
        if (!this.token() || !this.repo()) {
            log.info('Not fetching issues because we don\'t have all the config set', this.repo(), this.token());
            return;
        }

        github.get('search/issues', {q: this.allIssuesSearch()})
            .then(function(response) {
                return response.items.map(function(issue) { return new IssueView(issue); });
            }.bind(this))
            .tap(this.allIssues.bind(this))
            .catch(function(e) {
                var msg = 'Could not load open issues for repo ' + this.repo() + ' ' + e.message;
                log.error(msg, e);
                throw Error(msg);
            }.bind(this));
    }, 500, Heart.prototype),
    saveAllMilestonePriorities: _.debounce(function() {
        if (!this.branch() || !this.branch().length) { return when.resolve([]); }

        var tasks = this.milestones().map(function(milestone) { return milestone.savePriorities.bind(milestone); });
        return sequence(tasks);
    }, 10000, Heart.prototype),
    updateRepoInSearch: function(repo) {
        var search = this.allIssuesSearch().replace(/repo:[^\s]*/gi, '').replace(/\s{2,}/g, ' ').trim();

        search += ' repo:' + repo;
        this.allIssuesSearch(search);
    },
    issueMovedToMilestone: function(options, evt, ui) {
        var issue = options.item;
        var source = options.sourceParent();
        var target = options.targetParent();

        log.log('Issue moved', issue);

        if (source !== target) {
            log.log(source, '=>', target);
            var targetMilestone = _.find(this.milestones(), function(m) { return target === m.issueViews(); });
            if (!targetMilestone) {
                log.error('WTF happened. There\'s no milestone that matches the target', target);
                return;
            }

            log.log('Changing issue', issue.number(), 'to milestone', targetMilestone.title(), targetMilestone.number());

            issue.milestoneNumber(targetMilestone.number()).save();
        }

        this.saveAllMilestonePriorities();
    },
    issueRemovedFromMilestone: function(options, evt, ui) {
        var issue = options.item;
        var source = options.sourceParent();
        var target = options.targetParent();

        log.log('Removing issue from milestone', issue);

        issue.milestoneNumber('').save();

        this.saveAllMilestonePriorities();
    },
    showAssignUser: function(milestoneView, issue) {
        if (issue.assignUserVisible()) {
            issue.assignUserVisible(false);
            return;
        }

        log.log('Changing assignee for', milestoneView, issue);
        this.milestones().forEach(function(milestone) {
            milestone.issueViews().forEach(function(view) { view.assignUserVisible(false); });
        });

        issue.assignUserVisible(true);
    },
    openCredentialsDialog: function() {
        this.credentialsDialog.open()
            .done(function() {
                this.loadConfig();
                if (this.isConfigured()) {
                    this.loadData();
                }
            }.bind(this));
    }
});

module.exports = Heart;
