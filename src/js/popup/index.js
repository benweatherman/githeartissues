var _ = require('lodash');
var config = require('./config');

function Popup() {
    this.tokenEl = document.querySelector('#id-token');
    this.tokenEl.value = this.config.token;
    this.tokenEl.addEventListener('change', this.saveToken.bind(this));

    this.repoEl = document.querySelector('#id-repo');
    this.repoEl.value = this.config.repo;
    this.repoEl.addEventListener('change', this.saveRepo.bind(this));

    this.parseAppIDEl = document.querySelector('#id-parse-app-id');
    this.parseAppIDEl.value = this.config.parseAppID;
    this.parseAppIDEl.addEventListener('change', this.saveParseAppID.bind(this));

    this.parseKeyEl = document.querySelector('#id-parse-key');
    this.parseKeyEl.value = this.config.parseKey;
    this.parseKeyEl.addEventListener('change', this.saveParseKey.bind(this));

    console.log('Loaded git♥issues');
}

_.extend(Popup.prototype, {
    config: config,
    saveToken: function() {
        this.config.token = this.tokenEl.value;
    },
    saveRepo: function() {
        this.config.repo = this.repoEl.value;
    },
    saveParseAppID: function() {
        this.config.parseAppID = this.parseAppIDEl.value;
    },
    saveParseKey: function() {
        this.config.parseKey = this.parseKeyEl.value;
    }
});

module.exports = window.popup = new Popup();
