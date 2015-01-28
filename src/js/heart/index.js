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
var IssueStorage = require('./IssueStorage');
var User = require('./User');
var CredentialsDialog = require('./credentials/CredentialsDialog');

function Heart() {
    this.height = ko.observable();
    this.heightStyle = ko.computed(function() { return this.height() + 'px'; }.bind(this));

    var body = document.body;
    window.addEventListener('resize', this.updateHeight.bind(this, body));
    this.updateHeight(body);

    this.token = ko.observable();
    this.repo = ko.observable();
    this.branch = ko.observable();

    this.milestones = ko.observableArray();
    this.allIssues = ko.observableArray();
    this.allIssuesSearch = ko.observable('type:issues no:milestone state:open');
    this.allIssuesVisible = ko.observable(JSON.parse(localStorage.getItem('allIssuesVisible')));
    this.allIssuesVisible.subscribe(localStorage.setItem.bind(localStorage, 'allIssuesVisible'));
    this.allIssuesURL = ko.computed(function() { return 'https://github.com/' + this.repo() + '/issues'; }.bind(this));
    this.credentialsDialog = new CredentialsDialog();
    this.issueStorage = null;  // We'll wait to create this until we're sure everything's been configured

    this.isConfigured = ko.computed(function() { return this.token() && this.token().length && this.repo() && this.repo().length; }, this);

    this.token.subscribe(github.initialize.bind(undefined));

    this.repo.subscribe(this.updateRepoInSearch, this);

    this.allIssuesSearch.subscribe(this.fetchAllIssues, this);

    this.saving = ko.observable(false);
    this.needsSave = ko.computed(function() {
        var saving = this.saving();
        var hasDirtyMilestone = this.milestones().reduce(function(memo, milestone) { return milestone.dirty() || memo; }, false);

        return !saving && hasDirtyMilestone;
    }, this).extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 400 } });
}

_.extend(Heart.prototype, {
    template: fs.readFileSync(__dirname + '/index.html', 'utf8'),
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
        log.log('Fetching milestones for', this.repo());

        this.milestones.removeAll();

        this.issueStorage = this.issueStorage || new IssueStorage(this.repo(), this.branch());

        var milestoneSortOrder = JSON.parse(localStorage.getItem(this.getMilestoneSortKey()));

        var assigneesRequest = github.get('repos/' + this.repo() + '/assignees')
            .then(function(response) {
                return response.map(function(u) { return new User(u); });
            });

        var milestonesRequest = github.get('repos/' + this.repo() + '/milestones');

        when.all([assigneesRequest, milestonesRequest])
            .spread(function(assignees, milestonesResponse) {
                return milestonesResponse.map(function(m) { return new MilestoneView(m, assignees, this.issueStorage); }, this);
            }.bind(this))
            .then(this.sortMilestones.bind(this, milestoneSortOrder))
            .tap(this.milestones.bind(this))
            .catch(function(e) {
                var msg = 'Could not load ' + this.repo() + ' ' + e.message;
                log.error(msg, e);
                throw new Error(msg);
            }.bind(this));
    },
    getMilestoneSortKey: function() {
        return this.repo() + '-milestone-sort';
    },
    sortMilestones: function(sortOrder, milestones) {
        sortOrder = sortOrder || [];

        var remaining = milestones.map(function(view) { return view.number(); });
        var sorted = [];

        var milestonesByNumber = {};
        milestones.forEach(function(view) {
            milestonesByNumber[view.number()] = view;
        });

        sortOrder.forEach(function(number) {
            var milestone = milestonesByNumber[number];
            if (milestone) {
                sorted.push(milestone);
                delete remaining[remaining.indexOf(milestone.number())];
            }
        }.bind(this));

        remaining.forEach(function(number) {
            var milestone = milestonesByNumber[number];
            if (milestone) {
                sorted.push(milestone);
            }
        });

        return sorted;
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
    }, 300, Heart.prototype),
    updateRepoInSearch: function(repo) {
        var search = this.allIssuesSearch().replace(/repo:[^\s]*/gi, '').replace(/\s{2,}/g, ' ').trim();

        search += ' repo:' + repo;
        this.allIssuesSearch(search);
    },
    milestoneMoved: function(options, evt, ui) {
        var milestoneOrder = this.milestones().map(function(milestone) { return milestone.number(); });
        localStorage.setItem(this.getMilestoneSortKey(), JSON.stringify(milestoneOrder));
        log.log('Saved milestone order', this.milestones().map(function(milestone) { return milestone.title(); }));
    },
    openCredentialsDialog: function() {
        this.credentialsDialog.open()
            .done(function() {
                this.loadConfig();
                if (this.isConfigured()) {
                    this.loadData();
                }
            }.bind(this));
    },
    updateHeight: _.debounce(function(el) {
        this.height(el.offsetHeight);
    }, 200, Heart.prototype),
    save: function() {
        this.saving(true);

        var tasks = this.milestones().map(function(milestone) { return milestone.save.bind(milestone); });

        sequence(tasks)
            .tap(function() {
                return this.issueStorage.save();
            }.bind(this))
            .finally(this.saving.bind(this, false));
    },
    revert: function() {
        this.fetchAllIssues();
        this.milestones().forEach(function(milestone) { milestone.revert(); });
    }
});

module.exports = Heart;
