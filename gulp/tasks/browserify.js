var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task('browserify-popup', function() {

    var bundler = browserify({
        entries: ['./src/js/popup/index.js'],
        extensions: ['.js'],
        debug: true
    });

    return bundler
        .bundle()
        .pipe(source('popup.js'))
        .pipe(gulp.dest('./dist/js/'));
});

gulp.task('browserify-eventPage', function() {

    var bundler = browserify({
        entries: ['./src/js/eventPage/index.js'],
        extensions: ['.js'],
        debug: true
    });

    return bundler
        .bundle()
        .pipe(source('eventPage.js'))
        .pipe(gulp.dest('./dist/js/'));
});

gulp.task('browserify-♥', function() {

    var bundler = browserify({
        entries: ['./src/js/app/index.js'],
        extensions: ['.js'],
        debug: true
    });

    return bundler
        .bundle()
        .pipe(source('♥.js'))
        .pipe(gulp.dest('./dist/js/'));
});

gulp.task('browserify', ['browserify-popup', 'browserify-eventPage', 'browserify-♥']);
