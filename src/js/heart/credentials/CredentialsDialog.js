var fs = require('fs');

var _ = require('lodash');
var ko = require('knockout');
var when = require('when');

var log = require('../log');


ko.extenders.cached = function(target, key) {
    target.subscribe(function(newValue) {
        localStorage.setItem(key, newValue);
    });

    target(localStorage.getItem(key));

    return target;
};

function CredentialsDialog() {
    this.visible = ko.observable();

    this.token = ko.observable().extend({cached: 'git♥issues:token'});
    this.repo = ko.observable().extend({cached: 'git♥issues:repo'});
    this.parseAppID = ko.observable().extend({cached: 'git♥issues:parseAppID'});
    this.parseKey = ko.observable().extend({cached: 'git♥issues:parseKey'});

    this.deferred = null;
}

_.extend(CredentialsDialog.prototype, {
    template: fs.readFileSync(__dirname + '/CredentialsDialog.html', 'utf8'),
    open: function() {
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
            parseAppID: this.parseAppID(),
            parseKey: this.parseKey()
        };
    }
});

module.exports = CredentialsDialog;
