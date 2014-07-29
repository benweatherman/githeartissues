var gulp = require('gulp');
var rimraf = require('gulp-rimraf');

gulp.task('clean', function (done) {
  return gulp.src('./dist', {read: false})
    .pipe(rimraf({force: true}));
});
