var gulp = require('gulp');

gulp.task('watch', function() {
    gulp.watch('./src/js/**', ['build-js']);
    gulp.watch('./src/sass/**', ['build-css']);
    gulp.watch('./src/images/**', ['build-icons']);
    gulp.watch('./src/html/**', ['build-html']);
});
