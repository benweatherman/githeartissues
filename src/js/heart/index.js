var fs = require('fs');
var _ = require('lodash');
var when = require('when');
var ko = require('knockout');

var _koSortable = require('./lib/knockout-sortable');
var _koStringTemplate = require('./lib/knockout-string-template');

var Parse = require('parse');
var github = require('./github');

var MilestoneView = require('./MilestoneView');
var IssueView = require('./IssueView');
var User = require('./User');

var heart = {};
_.extend(heart, {
    template: fs.readFileSync(__dirname + '/index.html', 'utf8'),
    token: ko.observable(),
    repo: ko.observable(),
    parseAppID: ko.observable(),
    parseKey: ko.observable(),
    fetching: ko.observable(false),
    milestones: ko.observableArray(),
    allIssues: ko.observableArray(),
    allIssuesSearch: ko.observable('type:issues no:milestone state:open'),
    users: ko.observableArray(),
    show: function(el) {
        ko.applyBindings(this, el);
    },
    initParse: function() {
        if (!this.parseAppID() || !this.parseKey()) { return; }

        Parse.initialize(this.parseAppID(), this.parseKey());
    },
    start: function() {
        if (!this.token() || !this.repo() || !this.parseAppID() || !this.parseKey()) {
            console.info('Not loading git♥issues because we don\'t have all the config set', this.repo(), this.token(), this.parseAppID(), this.parseKey());
            return;
        }

        console.log('Fetching milestones for ', this.repo());

        github.get('repos/' + this.repo() + '/milestones')
            .then(function(response) {
                return response.map(function(m) { return new MilestoneView(m, this.repo()); }, this);
            }.bind(this))
            .tap(this.milestones.bind(this))
            .catch(function(e) {
                var msg = 'Could not load milestones for repo ' + this.repo() + ' ' + e.message;
                console.error(msg, e);
                throw Error(msg);
            }.bind(this));

        github.get('repos/' + this.repo() + '/assignees')
            .then(function(response) {
                return response.map(function(u) { return new User(u); });
            })
            .tap(this.users.bind(this))
            .catch(function(e) {
                var msg = 'Could not load users for repo ' + this.repo() + ' ' + e.message;
                console.error(msg, e);
                throw Error(msg);
            }.bind(this));
    },
    fetchAllIssues: _.debounce(function() {
        if (!this.token() || !this.repo()) {
            console.info('Not fetching issues because we don\'t have all the config set', this.repo(), this.token());
            return;
        }

        github.get('search/issues', {q: this.allIssuesSearch()})
            .then(function(response) {
                return response.items.map(function(issue) { return new IssueView(issue); });
            }.bind(this))
            .tap(this.allIssues.bind(this))
            .catch(function(e) {
                var msg = 'Could not load open issues for repo ' + this.repo() + ' ' + e.message;
                console.error(msg, e);
                throw Error(msg);
            }.bind(this));
    }, 500, heart),
    issueMovedToMilestone: function(options, evt, ui) {
        var issue = options.item;
        var source = options.sourceParent();
        var target = options.targetParent();

        console.log('Issue moved', issue);

        if (source !== target) {
            console.log(source, '=>', target);
            var targetMilestone = _.find(this.milestones(), function(m) { return target === m.issueViews(); });
            if (!targetMilestone) {
                console.error('WTF happened. There\'s no milestone that matches the target', target);
                return;
            }

            console.log('Changing issue', issue.number(), 'to milestone', targetMilestone.title(), targetMilestone.number());

            issue.milestoneNumber(targetMilestone.number()).save();
        }

        this.milestones().forEach(function(milestone) { milestone.saveSortOrder(milestone.issueViews()); });
    },
    issueRemovedFromMilestone: function(options, evt, ui) {
        var issue = options.item;
        var source = options.sourceParent();
        var target = options.targetParent();

        console.log('Removing issue from milestone', issue);

        issue.milestoneNumber('').save();

        this.milestones().forEach(function(milestone) { milestone.saveSortOrder(milestone.issueViews()); });
    },
    showAssignUser: function(milestoneView, issue) {
        if (issue.assignUserVisible()) {
            issue.assignUserVisible(false);
            return;
        }

        console.log('Changing assignee for', milestoneView, issue);
        this.milestones().forEach(function(milestone) {
            milestone.issueViews().forEach(function(view) { view.assignUserVisible(false); });
        });

        issue.assignUserVisible(true);
    }
});

heart.token.subscribe(github.initialize.bind(undefined));

heart.parseAppID.subscribe(heart.initParse.bind(heart));
heart.parseKey.subscribe(heart.initParse.bind(heart));

var start = _.debounce(heart.start, 100);
heart.token.subscribe(start, heart);
heart.repo.subscribe(start, heart);
heart.parseAppID.subscribe(start, heart);
heart.parseKey.subscribe(start, heart);

heart.repo.subscribe(function(repo) {
    var search = this.allIssuesSearch().replace(/repo:[^\s]+/gi, '').replace(/\s{2,}/g, ' ').trim();

    search += ' repo:' + repo;
    this.allIssuesSearch(search);
}, heart);

heart.allIssuesSearch.subscribe(heart.fetchAllIssues, heart);

heart.token(localStorage.getItem('git♥issues:token'));
heart.repo(localStorage.getItem('git♥issues:repo'));
heart.parseAppID(localStorage.getItem('git♥issues:parseAppID'));
heart.parseKey(localStorage.getItem('git♥issues:parseKey'));

module.exports = heart;
