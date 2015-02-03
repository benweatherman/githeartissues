var gulp = require('gulp');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var merge = require('merge-stream');
var deploy = require('gulp-gh-pages');
var version = require('../../package.json').version;

gulp.task('build-gh-pages', ['build'], function() {
    var html = gulp.src('html/gh-pages.html', {cwd: './dist'})
        .pipe(replace(/app.(css|js)/g, 'app.$1?v=' + version))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('./dist/gh-pages'));

    var css = gulp.src('./css/app.css', {cwd: './dist'})
        .pipe(gulp.dest('./dist/gh-pages/css'));

    var js = gulp.src('./js/app.js*', {cwd: './dist'})
        .pipe(gulp.dest('./dist/gh-pages/js'));

    var fonts = gulp.src('./fonts/*', {cwd: './dist'})
        .pipe(gulp.dest('./dist/gh-pages/fonts'));

    var imagemin = require('gulp-imagemin');
    var images = gulp.src('./images/**', {cwd: './dist/'})
        .pipe(imagemin())
        .pipe(gulp.dest('./dist/gh-pages/images'));

    return merge(html, css, js, fonts, images);
});

gulp.task('deploy', ['build-gh-pages'], function() {
    return gulp.src('./dist/gh-pages/**/*')
        .pipe(deploy({cacheDir: '/tmp/♥'}));
});
