var gulp = require('gulp');

gulp.task('build-images', function() {
    return gulp.src('src/images/**')
        .pipe(gulp.dest('./dist/images'));
});
