var fs = require('fs'),
    path = require('path'),
    gutil = require('gulp-util'),
    tasks = fs.readdirSync('./gulp/tasks/').filter(function(name) { return /(\.js$)/i.test(path.extname(name)); });

tasks.forEach(function(task) {
    gutil.log('Loading', gutil.colors.green(task) + '...');
    require('./tasks/' + task);
});
