var gulp = require('gulp');
var nunjucksRender = require('gulp-nunjucks-render');

gulp.task('build-html', function () {
    return gulp.src('./src/html/gh-pages.html')
        .pipe(nunjucksRender())
        .pipe(gulp.dest('./dist/html'));
});
