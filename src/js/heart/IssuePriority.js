var _ = require('lodash');
var when = require('when');
var github = require('./github');

var log = require('./log');


function IssuePriority(repo, milestone, milestoneName, branch) {
    this.repo = repo;
    this.milestone = milestone;
    this.milestoneName = milestoneName;
    this.branch = branch;

    this.filename = 'milestone-' + this.milestone + '.json';
    this.githubFilePath = 'repos/' + this.repo + '/contents/milestones/' + this.filename;
    this.cached = null;
}

_.extend(IssuePriority.prototype, {
    get: function() {
        return this.cached || (this.cached = this.readFile());
    },
    save: function(issueNumbers) {
        return this.writeFile(issueNumbers);
    },
    readFile: function() {
        return this.getFile()
            .then(function(fileInfo) {
                return JSON.parse(atob(fileInfo.content));
            })
            .catch(function(err) {
                log.warn('No config file for ', this.filename, err);
                return [];
            }.bind(this));
    },
    writeFile: function(issueNumbers) {
        return this.getFile()
            .catch(function() {
                return null;
            })
            .then(function(fileInfo) {
                var content = btoa(JSON.stringify(issueNumbers)) + '\n';

                log.log('Comparing old and new content for', this.milestoneName, content.trim(), '===', fileInfo && fileInfo.content.trim(), '=>', fileInfo && fileInfo.content === content);

                if (fileInfo && fileInfo.content === content) {
                    return fileInfo;
                }

                var data = {
                    message: (fileInfo ? 'Updated' : 'Created') + ' issue priority for ' + this.milestoneName,
                    content: content,
                    branch: this.branch,
                    sha: fileInfo && fileInfo.sha
                };

                return github.put(this.githubFilePath, data)
                    .then(function(response) {
                        var fileInfo = _.extend({}, response.content, {content: content});
                        return fileInfo;
                    });
            }.bind(this))
            .then(function(fileInfo) {
                this.__file = when.resolve(fileInfo);
                this.cached = when.resolve(issueNumbers);

                return issueNumbers;
            }.bind(this));
    },
    getFile: function() {
        return this.__file || (this.__file = github.get(this.githubFilePath, {ref: this.branch}));
    }
});

module.exports = IssuePriority;
