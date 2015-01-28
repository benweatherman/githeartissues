var ko = require('knockout');
var _ = require('lodash');

var log = require('./log');
var Issue = require('./Issue');

function IssueView() {
    Issue.apply(this, arguments);

    this.assignUserVisible = ko.observable();
    this.originalAssignee = ko.observable(this.assignee());

    this.dirty = ko.computed(function() {
        return this.originalAssignee() !== this.assignee();
    }.bind(this));
}

_.extend(IssueView.prototype, Issue.prototype, {
    assignUser: function(user) {
        log.log('ASSigning', user, 'to', this);
        this.assignee(user);
        this.assignUserVisible(false);
    },
    removeUser: function() {
        log.log('unASSigning user from', this);
        this.assignee(undefined);
        this.assignUserVisible(false);
    },
    save: function() {
        return Issue.prototype.save.apply(this, arguments)
            .tap(function() {
                this.originalAssignee(this.assignee());
            }.bind(this));
    },
    revert: function() {
        this.assignee(this.originalAssignee());
    }
});

module.exports = IssueView;
