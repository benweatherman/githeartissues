var gulp = require('gulp');

gulp.task('build-html', function () {
    var nunjucksRender = require('gulp-nunjucks-render');

    nunjucksRender.nunjucks.configure(['src/html/']);

    return gulp.src('src/html/*.html')
        .pipe(nunjucksRender())
        .pipe(gulp.dest('dist/html'));
});
