var config = require('../popup/config');

chrome.runtime.onMessage.addListener(function(request, sender, respond) {
    console.log('Sending config data', config.data);
    respond(config.data);
});
