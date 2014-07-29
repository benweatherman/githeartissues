var gulp = require('gulp');

gulp.task('build', ['browserify', 'nunjucks', 'sass', 'icons']);
