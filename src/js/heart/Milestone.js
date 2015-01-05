var ko = require('knockout');
var _ = require('lodash');
var github = require('./github');

var log = require('./log');
var Issue = require('./Issue');

function Milestone(data, repo) {
    this.repo = repo;

    this.number = ko.observable();
    this.title = ko.observable();
    this.description = ko.observable();
    this.issues = ko.observableArray();
    this.url = ko.observable();

    this.load(data);
}

_.extend(Milestone.prototype, {
    load: function(data) {
        this.data = data;

        this.number(data.number);
        this.title(data.title);
        this.description(data.description);
        this.url(data.url.replace(/api\.|repos\//g, ''));

        this.fetchIssues();
    },
    fetchIssues: function() {
        log.log('Fetching issues for milestone', this.number(), ':', this.title());

        var url = 'repos/' + this.repo + '/issues';
        var params = {page_page: 100, milestone: this.number()};

        return github.get(url, params)
            .then(function(response) {
                var issues = response.map(function(d) { return new Issue(d); }, this);
                this.issues(issues);
                return issues;
            }.bind(this))
            .catch(function(e) {
                var msg = 'Could not load issues for milestones ' + this.title();
                log.error(msg, e);
                throw Error(msg);
            }.bind(this));
    }
});

module.exports = Milestone;
