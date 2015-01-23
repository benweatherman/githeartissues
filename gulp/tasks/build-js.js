var gulp = require('gulp');

function build(minify) {
    var browserify = require('browserify');
    var source = require('vinyl-source-stream');
    var buffer = require('vinyl-buffer');
    var sourcemaps = require('gulp-sourcemaps');
    var uglify = require('gulp-uglify');
    var gulpif = require('gulp-if');
    var gutil = require('gulp-util');

    return browserify('./src/js/app/index.js')
        .bundle()
        .on('error', function(err) {
            if (minify) {
                throw new Error(err);
            }
            else {
                gutil.log(gutil.colors.red('✘'), err.message.trim());
            }
        })
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(gulpif(minify, uglify()))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/js/'));
}

gulp.task('build-js', build.bind(undefined, false));

gulp.task('build-js-app', build.bind(undefined, true));
