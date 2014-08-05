var gulp = require('gulp');
var rename = require('gulp-rename');
var deploy = require('gulp-gh-pages');

gulp.task('deploy', function() {
    gulp.src('html/gh-pages.html', {cwd: './dist'})
        .pipe(rename('index.html'))
        .pipe(gulp.dest('./dist/gh-pages'));

    gulp.src('./css/app.css', {cwd: './dist'})
        .pipe(gulp.dest('./dist/gh-pages/css'));

    gulp.src('./js/app.js', {cwd: './dist'})
        .pipe(gulp.dest('./dist/gh-pages/js'));

    var options = {cacheDir: '/tmp/♥'};
    gulp.src('./dist/gh-pages/**/*')
        .pipe(deploy(options));
});
