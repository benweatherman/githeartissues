var ko = require('knockout');
var _ = require('lodash');

function Label(data) {
    this.name = ko.observable();
    this.color = ko.observable();
    this.url = ko.observable();

    this.load(data);
}

_.extend(Label.prototype, {
    load: function(data) {
        this.data = data;

        this.name(data.name);
        this.color('#' + data.color);
        this.url(data.url);
    }
});

module.exports = Label;
