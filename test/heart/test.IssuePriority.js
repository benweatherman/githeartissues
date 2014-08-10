var fs = require('fs');

var IssuePriority = require('../../src/js/heart/IssuePriority');


describe('IssuePriority', function() {
    var server, priorities;

    beforeEach(function() {
        server = sinon.fakeServer.create();

        priorities = new IssuePriority('test/repo', 9, 'My Milestone', 'githeartissues');
    });

    afterEach(function() {
        if (server) { server.restore(); }
    });

    describe('getFile', function() {
        it('should only make a single request', function(done) {
            var firstPromise = priorities.getFile(),
                secondPromise;

            firstPromise.then(function() {
                    secondPromise = priorities.getFile();
                    return secondPromise;
                })
                .then(function() {
                    expect(server.requests.length).to.equal(1);
                    expect(firstPromise).to.equal(secondPromise);
                    done();
                })
                .catch(done.bind(undefined));

            server.requests[0].respond(200, {'Content-Type': 'application/json'}, JSON.stringify({womp: 1}));
        });
    });

    describe('readFile', function() {
        it('should return an empty array if the config file does\'t exit', function(done) {
            priorities.readFile()
                .then(function(issueNumbers) {
                    expect(issueNumbers).to.deep.equal([]);
                    done();
                })
                .catch(done.bind(undefined));

            server.requests[0].respond(404, {'Content-Type': 'application/json'}, JSON.stringify({womp: 1}));
        });

        it('should return the JSON content if the file exists', function(done) {
            var expected = [35,69,72,99,404];

            priorities.readFile()
                .then(function(issueNumbers) {
                    expect(issueNumbers).to.deep.equal(expected);
                    done();
                })
                .catch(done.bind(undefined));

            var response = {
                name: 'milestone-1.json',
                path: 'milestones/milestone-1.json',
                sha: 'c071f5c61ba5f3faa0fda248c316c7ac44e7f1b8',
                size: 9,
                url: 'https://api.github.com/repos/benweatherman/creepo/contents/milestones/milestone-1.json?ref=githeartissues',
                html_url: 'https://github.com/benweatherman/creepo/blob/githeartissues/milestones/milestone-1.json',
                git_url: 'https://api.github.com/repos/benweatherman/creepo/git/blobs/c071f5c61ba5f3faa0fda248c316c7ac44e7f1b8',
                type: 'file',
                content: btoa(JSON.stringify(expected)) + '\n',
                encoding: 'base64',
                _links: {
                    self: 'https://api.github.com/repos/benweatherman/creepo/contents/milestones/milestone-1.json?ref=githeartissues',
                    git: 'https://api.github.com/repos/benweatherman/creepo/git/blobs/c071f5c61ba5f3faa0fda248c316c7ac44e7f1b8',
                    html: 'https://github.com/benweatherman/creepo/blob/githeartissues/milestones/milestone-1.json'
                }
            };

            server.requests[0].respond(304, {'Content-Type': 'application/json'}, JSON.stringify(response));
        });
    });

    describe('writeFile', function() {

    });
});
