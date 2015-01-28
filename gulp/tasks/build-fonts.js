var gulp = require('gulp');

gulp.task('build-fonts', function() {
    return gulp.src('./fonts/*', {cwd: 'node_modules/font-awesome'})
        .pipe(gulp.dest('./dist/fonts'));
});
