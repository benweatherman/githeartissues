var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function() {
    return gulp.src('./src/sass/*.scss')
        .pipe(sass({sourceComments: 'map', sourceMap: 'sass', style: 'compact'}))
        .pipe(gulp.dest('./dist/css'));
});
