var gulp = require('gulp');
var deploy = require('gulp-gh-pages');

gulp.task('deploy', function() {
    var options = {push: false};

    gulp.src('./dist/**/*')
        .pipe(deploy(options));
});
