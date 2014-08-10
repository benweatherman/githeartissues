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
    this.repo = ko.observable().extend({cached: 'git♥issues:repo'});
    this.branch = ko.observable().extend({cached: 'git♥issues:branch'});
    this.branchExists = ko.observable(true);

    this.token.subscribe(github.initialize.bind(undefined));

    this.token.subscribe(this.checkForDefaultBranch.bind(this));
    this.repo.subscribe(this.checkForDefaultBranch.bind(this));

    this.branch.subscribe(_.debounce(this.setBranchExists, 500), this);

    this.deferred = null;
}

_.extend(CredentialsDialog.prototype, {
    template: fs.readFileSync(__dirname + '/CredentialsDialog.html', 'utf8'),
    open: function() {
        this.setBranchExists(this.branch());

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
    checkForDefaultBranch: function() {
        if (this.branch() && this.branch().length) { return; }

        this.doesBranchExist(DEFAULT_BRANCH)
            .done(function(exists) {
                if (exists) {
                    this.branch(DEFAULT_BRANCH);
                }
            }.bind(this));
    },
    setBranchExists: function(branch) {
        this.doesBranchExist(branch)
            .then(function(exists) {
                this.branchExists(exists);
            }.bind(this))
            .catch(this.branchExists.bind(false));
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
