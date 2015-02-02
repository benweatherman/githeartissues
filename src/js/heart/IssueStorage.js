var _ = require('lodash');
var when = require('when');
var github = require('./github');

var log = require('./log');


function IssueStorage(repo, branch) {
    this.repo = repo;
    this.branch = branch;
    this.githubFilePath = 'repos/' + this.repo + '/contents/githeartissues/milestones.json';

    this.fileInfoCache = {};
    this.issuesByMilestone = {};
}

_.extend(IssueStorage.prototype, {
    getIssuesForMilestone: function(milestone) {
        var issues = this.issuesByMilestone[milestone.number()];

        if (issues) {
            return when.resolve(issues);
        }

        return this.getFileInfo(this.branch, this.githubFilePath)
            .then(function(fileInfo) {
                this.issuesByMilestone = JSON.parse(atob(fileInfo.content));
                return this.issuesByMilestone[milestone.number()] || [];
            }.bind(this))
            .catch(function(err) {
                log.warn('No config file for ', this.githubFilePath, err);
                return when.resolve([]);
            }.bind(this));
    },
    getSortOrder: function(milestone) {
        return this.getIssuesForMilestone(milestone)
            .then(function(issueInfos) {
                return issueInfos.map(function(info) { return info.number; });
            });
    },
    saveSortOrder: function(milestone, issues) {
        var sortOrder = issues.map(function(issue) { return issue.number(); });

        this.issuesByMilestone[milestone.number()] = issues.map(function(issue) { return {title: issue.title(), number: issue.number()}; });

        return when.resolve(sortOrder);
    },
    save: function() {
        return this.getFileInfo(this.branch, this.githubFilePath)
            .catch(function() {
                return null;
            })
            .then(function(fileInfo) {
                var content = btoa(JSON.stringify(this.issuesByMilestone, undefined, 2)) + '\n';
                var originalContent = fileInfo && fileInfo.content;

                if (content === originalContent) {
                    log.info('Not saving issues since the content has not changed', content, '!==', originalContent);
                    return this.issuesByMilestone;
                }

                var data = {
                    message: (fileInfo ? 'Update' : 'Create') + ' issue priorities',
                    content: content,
                    branch: this.branch,
                    sha: fileInfo && fileInfo.sha
                };

                return github.put(this.githubFilePath, data);
            }.bind(this))
            .then(function(response) {
                var key = this.branch + ':' + this.githubFilePath;
                var fileInfo = _.clone(response.content);
                this.fileInfoCache[key] = when.resolve(response.content);

                log.log('Cached saved file info', fileInfo);

                return this.issuesByMilestone;
            }.bind(this));
    },
    getFileInfo: function(branch, path) {
        var key = branch + ':' + path;
        return this.fileInfoCache[key] || (this.fileInfoCache[key] = github.get(path, {ref: branch}));
    }
});

module.exports = IssueStorage;
