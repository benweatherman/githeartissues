var fs = require('fs');
var _ = require('lodash');
var when = require('when');
var ko = require('knockout');

var _koSortable = require('./lib/knockout-sortable');
var _koStringTemplate = require('./lib/knockout-string-template');

var Parse = require('parse');
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
    this.parseAppID = ko.observable();
    this.parseKey = ko.observable();
    this.fetching = ko.observable(false);
    this.milestones = ko.observableArray();
    this.allIssues = ko.observableArray();
    this.allIssuesSearch = ko.observable('type:issues no:milestone state:open');
    this.users = ko.observableArray();
    this.credentialsDialog = new CredentialsDialog();

    this.isConfigured = ko.computed(this.getIsConfigured, this);

    this.token.subscribe(github.initialize.bind(undefined));
    this.parseAppID.subscribe(this.initParse, this);
    this.parseKey.subscribe(this.initParse, this);

    this.repo.subscribe(this.updateRepoInSearch, this);

    this.allIssuesSearch.subscribe(this.fetchAllIssues, this);
}

_.extend(Heart.prototype, {
    getIsConfigured: function() {
        var thingies = [this.token(), this.repo(), this.parseAppID(), this.parseKey()],
            isConfigured = thingies.reduce(function(allConfigured, thingy) { return allConfigured && !!thingy && thingy.length; }, true);

        return isConfigured;
    },
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
    initParse: function() {
        if (!this.parseAppID() || !this.parseKey()) { return; }

        Parse.initialize(this.parseAppID(), this.parseKey());
    },
    loadData: function() {
        log.log('Fetching milestones for ', this.repo());

        this.milestones.removeAll();

        github.get('repos/' + this.repo() + '/milestones')
            .then(function(response) {
                return response.map(function(m) { return new MilestoneView(m, this.repo()); }, this);
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
        this.token(localStorage.getItem('git♥issues:token'));
        this.repo(localStorage.getItem('git♥issues:repo'));
        this.parseAppID(localStorage.getItem('git♥issues:parseAppID'));
        this.parseKey(localStorage.getItem('git♥issues:parseKey'));
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

        this.milestones().forEach(function(milestone) { milestone.saveSortOrder(milestone.issueViews()); });
    },
    issueRemovedFromMilestone: function(options, evt, ui) {
        var issue = options.item;
        var source = options.sourceParent();
        var target = options.targetParent();

        log.log('Removing issue from milestone', issue);

        issue.milestoneNumber('').save();

        this.milestones().forEach(function(milestone) { milestone.saveSortOrder(milestone.issueViews()); });
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
