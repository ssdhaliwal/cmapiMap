// gulpfile.js
var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('concatCSS', function() {
    console.log("Concating and moving all the css files in styles folder");
    return concatCSS();
  });
  
function concatCSS() {
    return gulp.src(["**/*.css", "!*.css", "!node_modules/**/*", "!TestingSamples/**/*", "!ProxyUpdates/**/*", "!build/**/*"])
    .pipe(concat('cmapi_esri3.css'))
    .pipe(gulp.dest('build/'));
}

gulp.task('concatJS', function() {
    console.log("Concating and moving all the js files in styles folder");
    return concatJS();
  });

function concatJS() {
    return gulp.src(["**/*.js", "!*.js", "!node_modules/**/*", "!TestingSamples/**/*", "!ProxyUpdates/**/*", "!build/**/*"])
    .pipe(concat('cmapi_esri3.js'))
    .pipe(gulp.dest('build/'));
}

gulp.task('default', gulp.parallel('concatCSS', 'concatJS'), function(done) {
    done();
});
