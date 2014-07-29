var fs = require('fs');

var heart = require('../heart/index.js');

if (chrome && chrome.runtime) {
    // Listen for the extension to send us new values
    chrome.runtime.onMessage.addListener(function(data, sender, respondWith) {
        heart.token(data.token);
        heart.repo(data.repo);

        heart.parseAppID(data.parseAppID);
        heart.parseKey(data.parseKey);

        respondWith({});
    });

    // Ask for the current config
    chrome.runtime.sendMessage({}, function(response) {
        console.log('Extension config', response);

        heart.token(response.token);
        heart.repo(response.repo);
        heart.parseAppID(response.parseAppID);
        heart.parseKey(response.parseKey);
    });
}

var contentEl = document.querySelector('#js-repo-pjax-container .table-list-milestones');
if (contentEl) {
    var newEl = document.createElement('div');
    newEl.innerHTML = fs.readFileSync(__dirname + '/../heart/index.html', 'utf8');
    contentEl.parentNode.appendChild(newEl);

    heart.show(newEl);

    contentEl.style.display = 'none';
}
else {
    console.error('Not loading git♥issues because contentEl ===', contentEl);
}
window['♥'] = heart;
