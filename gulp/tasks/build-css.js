var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('build-css', function() {
    var paths = [].concat(require('node-bourbon').includePaths, require('node-neat').includePaths);

    return gulp.src('./src/sass/*.scss')
        .pipe(sass({
            sourceComments: 'map',
            sourceMap: 'sass',
            style: 'compact',
            includePaths: paths
        }))
        .pipe(gulp.dest('./dist/css'));
});
