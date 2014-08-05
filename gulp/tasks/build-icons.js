var gulp = require('gulp');
var raster = require('gulp-raster');
var rename = require('gulp-rename');

gulp.task('icon-16', function () {
    return gulp.src('./src/images/heart.svg')
        .pipe(raster())
        .pipe(rename({basename: 'icon', extname: '.png', suffix: '-16'}))
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('icon-48', function () {
    return gulp.src('./src/images/heart.svg')
        .pipe(raster())
        .pipe(rename({basename: 'icon', extname: '.png', suffix: '-48'}))
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('icon-128', function () {
    return gulp.src('./src/images/heart.svg')
        .pipe(raster())
        .pipe(rename({basename: 'icon', extname: '.png', suffix: '-128'}))
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('build-icons', ['icon-16', 'icon-48', 'icon-128']);
