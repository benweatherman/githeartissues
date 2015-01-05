var gulp = require('gulp');
var karma = require('gulp-karma');
var concat = require('gulp-concat');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var generateSuite = require('gulp-mocha-browserify-sweet');

gulp.task('test-suite', function() {
    return gulp.src('test/**/test.*.js')
        .pipe(generateSuite({addPrefix: '../../test'}))
        .pipe(concat('suite.js'))
        .pipe(gulp.dest('dist/test'));
});

gulp.task('test', ['test-suite'], function() {
    return browserify({entries: './dist/test/suite.js', debug: true})
        .bundle()
        .pipe(source('deps.min.js'))
        .pipe(gulp.dest('dist/test'))
        .pipe(karma({
            frameworks: ['mocha', 'chai', 'sinon'],
            browsers: ['Chrome'],
            reporters: ['nyan', 'junit'],
            junitReporter: {
                outputFile: 'dist/test/test-results.xml'
            }
        }));
});
