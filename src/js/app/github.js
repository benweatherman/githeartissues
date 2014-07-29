var requests = require('./requests');

var TOKEN = '';

var github = {
    initialize: function(token) {
        TOKEN = token;
    },
    get: function(url, params) {
        var fullURL = this.getURL(url);

        return requests.get(fullURL, params, this.defaultHeaders);
    },
    patch: function(url, data) {
        var fullURL = this.getURL(url);

        return requests.patch(fullURL, data, this.defaultHeaders);
    },
    getURL: function(url) {
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
