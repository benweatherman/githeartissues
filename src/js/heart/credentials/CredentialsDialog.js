var fs = require('fs');

var _ = require('lodash');
var ko = require('knockout');
var when = require('when');

var log = require('../log');
var github = require('../github');

var DEFAULT_BRANCH = 'githeartissues';


ko.extenders.cached = function(target, key) {
    target.subscribe(function(newValue) {
        localStorage.setItem(key, JSON.stringify(newValue));
    });

    var currentValue = localStorage.getItem(key);
    try {
        currentValue = JSON.parse(currentValue);
    }
    catch(err) {
    }

    target(currentValue);

    return target;
};

function CredentialsDialog() {
    this.visible = ko.observable();

    this.token = ko.observable().extend({cached: 'git♥issues:token'});
    this.tokenError = ko.observable(false);
    this.token.subscribe(github.initialize, github);
    this.token.subscribe(this.checkForDefaultBranch, this);
    this.token.subscribe(this.validateToken, this);

    this.repo = ko.observable().extend({cached: 'git♥issues:repo'});
    this.repoError = ko.observable(false);
    this.repo.subscribe(this.checkForDefaultBranch, this);
    this.repo.subscribe(this.validateRepo, this);

    this.branch = ko.observable().extend({cached: 'git♥issues:branch'});
    this.showBranchInstructions = ko.observable(true);
    this.branch.subscribe(_.debounce(this.setShowBranchInstructions, 500), this);

    this.deferred = null;
}

_.extend(CredentialsDialog.prototype, {
    template: fs.readFileSync(__dirname + '/CredentialsDialog.html', 'utf8'),
    open: function() {
        this.setShowBranchInstructions(this.branch());

        this.checkForDefaultBranch();

        this.visible(true);

        this.deferred = when.defer();

        return this.deferred.promise;
    },
    close: function() {
        this.visible(false);

        this.deferred.resolve(this.serialize());
    },
    serialize: function() {
        return {
            token: this.token(),
            repo: this.repo(),
            branch: this.branch()
        };
    },
    validateToken: function() {
        if (!this.token() || !this.token().length) { this.tokenError(true); return; }

        github.get('user/repos')
            .then(this.tokenError.bind(this, false))
            .catch(this.tokenError.bind(this, true));

        this.tokenError(false);
    },
    validateRepo: function() {
        if (!this.token() || !this.token().length || !this.repo() || !this.repo().length) { this.repoError(true); return; }

        github.get('repos/' + this.repo() + '/git/refs/heads')
            .then(this.repoError.bind(this, false))
            .catch(this.repoError.bind(this, true));
    },
    checkForDefaultBranch: function() {
        if (this.branch() && this.branch().length) { return; }

        this.doesBranchExist(DEFAULT_BRANCH)
            .done(function(exists) {
                if (exists) {
                    this.branch(DEFAULT_BRANCH);
                }
            }.bind(this));
    },
    setShowBranchInstructions: function(branch) {
        if (!branch || !branch.length) { this.showBranchInstructions(false); return; }

        this.doesBranchExist(branch)
            .then(function(exists) {
                this.showBranchInstructions(!exists);
            }.bind(this))
            .catch(this.showBranchInstructions.bind(false));
    },
    doesBranchExist: function(branch) {
        return github.get('repos/' + this.repo() + '/git/refs/heads')
            .then(function(heads) {
                var ref = _.find(heads, function(head) { return head.ref === 'refs/heads/' + branch; });
                return !!ref;
            });
    }
});

module.exports = CredentialsDialog;
