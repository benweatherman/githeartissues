var gulp = require('gulp');
var nunjucksRender = require('gulp-nunjucks-render');

gulp.task('nunjucks', function () {
    return gulp.src('./src/html/*.html')
        .pipe(nunjucksRender())
        .pipe(gulp.dest('./dist/html'));
});
