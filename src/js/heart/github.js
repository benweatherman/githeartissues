var requests = require('./requests');

var TOKEN = '';

var github = {
    initialize: function(token) {
        TOKEN = token;
    },
    get: function(url, params) {
        var fullURL = this.formatURL(url);

        return requests.get(fullURL, params, this.defaultHeaders);
    },
    post: function(url, data) {
        var fullURL = this.formatURL(url);

        return requests.post(fullURL, data, this.defaultHeaders);
    },
    patch: function(url, data) {
        var fullURL = this.formatURL(url);

        return requests.patch(fullURL, data, this.defaultHeaders);
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
            Accept: 'application/vnd.github.raw+json',
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': 'token ' + TOKEN
        };
    }
});

module.exports = github;
