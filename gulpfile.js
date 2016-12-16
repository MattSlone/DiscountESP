var gulp = require('gulp');
    postcss = require('gulp-postcss');
    path = require('path');

gulp.task('css', function () {
    var processors = [
        require('postcss-import'),
        require('postcss-nested'),
        require('postcss-simple-vars'),
        require('postcss-media-minmax'),
        require('autoprefixer')({ browsers: ['last 2 versions', '> 2%'] })
    ];
    return gulp.src(path.resolve(__dirname, 'resources', 'assets', 'postcss') + '/styles.css')
        .pipe(postcss(processors))
        .pipe(gulp.dest(path.resolve(__dirname, 'public', 'css')));
});

/**/
/**/
