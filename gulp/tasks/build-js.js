var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task('build-js-app', function() {

    var bundler = browserify({
        entries: ['./src/js/app/index.js'],
        extensions: ['.js'],
        debug: true
    });

    return bundler
        .bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('./dist/js/'));
});

gulp.task('build-js', ['build-js-app']);
