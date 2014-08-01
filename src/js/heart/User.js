var ko = require('knockout');
var _ = require('lodash');

function User(data) {
    this.login = ko.observable();
    this.avatarURL = ko.observable();

    this.load(data);
}

_.extend(User.prototype, {
    load: function(data) {
        this.login(data.login);
        this.avatarURL(data.avatar_url);
    }
});

module.exports = User;
