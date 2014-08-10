var _ = require('lodash');
var requests = require('./requests');

var TOKEN = '';

var github = {
    initialize: function(token) {
        TOKEN = token;
    },
    get: function(url, params, headers) {
        var fullURL = this.formatURL(url);

        return requests.get(fullURL, params, _.extend(this.defaultHeaders, headers));
    },
    post: function(url, data, headers) {
        var fullURL = this.formatURL(url);

        return requests.post(fullURL, data, _.extend(this.defaultHeaders, headers));
    },
    put: function(url, data, headers) {
        var fullURL = this.formatURL(url);

        return requests.put(fullURL, data, _.extend(this.defaultHeaders, headers));
    },
    patch: function(url, data, headers) {
        var fullURL = this.formatURL(url);

        return requests.patch(fullURL, data, _.extend(this.defaultHeaders, headers));
    },
    delete: function(url) {
        var fullURL = this.formatURL(url);

        return requests.delete(fullURL, this.defaultHeaders);
    },
    formatURL: function(url) {
        if (!/^https:/.test(url)) {
            return 'https://api.github.com/' + url;
        }

        return url;
    }
};

Object.defineProperty(github, 'defaultHeaders', {
    get: function() {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': 'token ' + TOKEN
        };
    }
});

module.exports = github;
