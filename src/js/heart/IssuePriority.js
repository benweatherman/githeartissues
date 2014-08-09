var _ = require('lodash');
var when = require('when');
var Parse = require('parse');

var IssuePriorityStorage = Parse.Object.extend('IssueOrdering', {
    initialize: function(attrs, options) {
        this.set('numbers', []);
    }
});

function IssuePriority(repo, milestoneNumber) {
    this.repo = repo;
    this.milestoneNumber = milestoneNumber;

    this.storage = null;

    var query = new Parse.Query(IssuePriorityStorage);
    this.query = query.equalTo('repo', repo).equalTo('milestone', milestoneNumber);
}

_.extend(IssuePriority.prototype, {
    cached: null,
    get: function() {
        if (this.cached !== null) {
            return when.resolve(this.cached);
        }

        return this.getStorage()
            .then(function(storageObj) {
                return storageObj.get('numbers');
            });
    },
    save: function(issueNumbers) {
        this.cached = issueNumbers;

        return this.getStorage()
                    .then(function() {
                        this.storage.set('numbers', issueNumbers);
                        return this.storage.save();
                    }.bind(this));
    },
    getStorage: function() {
        if (this.storage) { return when.resolve(this.storage); }

        return this.query.first()
                    .then(function(response) {
                        this.storage = response ? response : new IssuePriorityStorage({repo: this.repo, milestone: this.milestoneNumber});

                        return this.storage;
                    }.bind(this));
    },
});

module.exports = IssuePriority;
