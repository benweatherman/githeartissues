var gulp = require('gulp');
var git = require('gulp-git');
var bump = require('gulp-bump');
var tag = require('gulp-tag-version');

gulp.task('bump', function() {
    return gulp.src('./package.json')
        .pipe(bump({type: 'patch'}))
        .pipe(gulp.dest('./'))
        .pipe(git.commit('Update version for release :cake:'))
        .pipe(tag())
        .pipe(git.push('origin', 'master', {args: '--tags'}));
});
