var _ = require('lodash');

function Config() {
    this.token = localStorage.getItem('git♥issues:token') || '';
    this.repo = localStorage.getItem('git♥issues:repo') || '';
    this.parseAppID = localStorage.getItem('git♥issues:parseAppID') || '';
    this.parseKey = localStorage.getItem('git♥issues:parseKey') || '';
}

_.extend(Config.prototype, {
    notify: function() {
        var url = 'https://github.com/' + this.repo + '/milestones';
        console.log('Sending current config to content pages:', this.data);

        chrome.tabs.query({currentWindow: true, url: url}, function(tabs) {
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, this.data, function(response) {
                    console.log('Content page response:', response);
                });
            }.bind(this));
        }.bind(this));
    }
});

Object.defineProperty(Config.prototype, 'token', {
    get: function() { return this._token; },
    set: function(token) {
        localStorage.setItem('git♥issues:token', token);
        this._token = token;
        this.notify();
    }
});

Object.defineProperty(Config.prototype, 'repo', {
    get: function() { return this._repo; },
    set: function(repo) {
        localStorage.setItem('git♥issues:repo', repo);
        this._repo = repo;
        this.notify();
    }
});

Object.defineProperty(Config.prototype, 'parseAppID', {
    get: function() { return this._parseAppID; },
    set: function(parseAppID) {
        localStorage.setItem('git♥issues:parseAppID', parseAppID);
        this._parseAppID = parseAppID;
        this.notify();
    }
});

Object.defineProperty(Config.prototype, 'parseKey', {
    get: function() { return this._parseKey; },
    set: function(parseKey) {
        localStorage.setItem('git♥issues:parseKey', parseKey);
        this._parseKey = parseKey;
        this.notify();
    }
});

Object.defineProperty(Config.prototype, 'data', {
    get: function() { return {token: this.token, repo: this.repo, parseAppID: this.parseAppID, parseKey: this.parseKey}; }
});


var config = new Config();

module.exports = config;
