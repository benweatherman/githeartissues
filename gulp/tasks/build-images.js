var gulp = require('gulp');
var imagemin = require('gulp-imagemin');

gulp.task('build-images-server', function() {
    return gulp.src('./images/**', {cwd: './static/'})
        .pipe(imagemin())
        .pipe(gulp.dest('./dist/static/images'));
});

gulp.task('build-images', function() {
    return gulp.src('./images/**', {cwd: './static'})
        .pipe(gulp.dest('./dist/static/images'));
});
