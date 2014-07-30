/**
 * Out of the box, knockout only allows you to specify a selector ID of a `script` tag
 * as a template. This template engine extends this functionality where if a script with
 * the ID doesn't exist, it tries to parse the value passed in as HTML and uses that element
 * as the template node.
 *
 * For example, before you could only do this:
 * @example
 * <script id="funky"><span>I'm already in the DOM</span></script>
 * <div data-bind="template: {name: 'funky'}"></div>
 *
 * But now you should be able to do this instead:
 * @example
 * <div data-bind="template: {name: '<span>I\'m already in the DOM</span>'}"></div>
 */
var ko = require('knockout');
var md5 = require('MD5');

var engine = new ko.nativeTemplateEngine();
var originalMakeTemplateSource = engine.makeTemplateSource;
var cachedTemplates = engine.cachedTemplates = {};

engine.makeTemplateSource = function(template, doc) {
    try {
        return originalMakeTemplateSource.apply(this, arguments);
    }
    catch(e) {
        // If we've gotten here, the original template source didn't know how to handle this type
        // of template. We'll assume it's a string and go with god.
        var key = md5(template);

        if (!cachedTemplates[key]) {
            var el = ko.utils.parseHtmlFragment('<div>' + template + '</div>')[0];
            cachedTemplates[key] = new ko.templateSources.domElement(el);
        }

        return cachedTemplates[key];
    }
};

engine.clearCache = function() {
    cachedTemplates = this.cachedTemplates = {};
};

ko.stringTemplateEngine = engine;

ko.setTemplateEngine(engine);

module.exports = engine;
