var gulp = require('gulp');

gulp.task('watch', function() {
    gulp.watch('./src/js/**', ['browserify']);
    gulp.watch('./src/sass/**', ['sass']);
    gulp.watch('./src/images/**', ['icons']);
    gulp.watch('./src/html/**', ['nunjucks']);
});
