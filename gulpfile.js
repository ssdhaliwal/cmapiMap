// gulpfile.js configuration
// npm init
// npm install gulp gulp-debug gulp-rimraf gulp-newer gulp-imagemin gulp-noop gulp-htmlclean gulp-concat gulp-deporder gulp-terser gulp-minify gulp-clean-css gulp-uglify-es --save-dev
// npm install gulp-strip-debug gulp-sourcemaps --save-dev

const
    // modules
    gulp = require('gulp'),
    babel = require('gulp-babel'),
    debug = require('gulp-debug'),
    remove = require('gulp-rimraf'),
    newer = require('gulp-newer'),
    imagemin = require('gulp-imagemin'),
    noop = require('gulp-noop'),
    htmlclean = require('gulp-htmlclean'),
    concat = require('gulp-concat'),
    deporder = require('gulp-deporder'),
    terser = require('gulp-terser'),
    minify = require('gulp-minify'),
    cleanCss = require('gulp-clean-css'),
    uglify = require('gulp-uglify-es').default,

    // development mode?
    devBuild = (process.env.NODE_ENV !== 'production'),

    stripdebug = devBuild ? null : require('gulp-strip-debug'),
    sourcemaps = require('gulp-sourcemaps'),

    // folders
    src = '',
    build = 'build/'
    ;

// clear old build folder
function cleanBuild() {

    const out = build;

    return gulp.src(out + "/*", { read: false })
        .pipe(debug())
        .pipe(remove());
}

exports.cleanBuild = cleanBuild;

// image processing
function images() {

    const out = build;

    return gulp.src([src + '**/*.{gif,jpg,png,svg}', "!*.*", "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*", "!" + src + "vendor/**/*"])
        .pipe(newer(out))
        .pipe(debug())
        .pipe(imagemin({ optimizationLevel: 5 }))
        .pipe(gulp.dest(out));

}

//exports.images = gulp.series(cleanBuild, images);
exports.images = images;

// HTML processing
function html() {

    const out = build;

    return gulp.src([src + '**/*.{html,htm}', "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*", "!" + src + "vendor/**/*"])
        .pipe(newer(out))
        .pipe(debug())
        .pipe(devBuild ? noop() : htmlclean())
        .pipe(gulp.dest(out));
}

//exports.html = gulp.series(cleanBuild, images, html);
exports.html = html;

// JavaScript processing
function jsDebug() {

    const out = build;

    return gulp.src([src + '**/*.js', "!*.*", "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*", "!" + src + "vendor/**/*"])
        .pipe(newer(out))
        .pipe(debug())
        .pipe(sourcemaps.init())
        /*.pipe(deporder())*/
        /*.pipe(concat('main.js'))*/
        .pipe(stripdebug ? stripdebug() : noop())
        .pipe(terser())
        .pipe(minify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(out));

}

// JavaScript processing
function js() {

    const out = build;

    return gulp.src([src + '**/*.js', "!*.*", "!" + src + "node_modules/**/*", "!" + src + "build/**/*", "!" + src + "vendor/**/*"])
        .pipe(newer(out))
        .pipe(debug())
        .pipe(babel({presets: ['@babel/preset-env'] }))
        .pipe(sourcemaps.init())
        /*.pipe(deporder())*/
        /*.pipe(concat('main.js'))*/
        .pipe(stripdebug ? stripdebug() : noop())
        .pipe(terser())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(out));

}

//exports.js = gulp.series(cleanBuild, images, html, js);
exports.js = js;

function json() {

    const out = build;

    return gulp.src([src + '**/*.json', "*.json", "!**/package*.json", "!" + src + "node_modules/**/*", "!" + src + "build/**/*", "!" + src + "vendor/**/*"])
        .pipe(newer(out))
        .pipe(debug())
        .pipe(gulp.dest(out));

}

//exports.js = gulp.series(cleanBuild, images, html, js, vendor);
exports.json = json;

function vendor() {

    const out = build;

    return gulp.src([src + "vendor/**/*.*"], {base:"."})
        .pipe(newer(out))
        .pipe(debug())
        .pipe(gulp.dest(out));

}

//exports.js = gulp.series(cleanBuild, images, html, js, vendor);
exports.vendor = vendor;

// CSS processing
function css() {

    const out = build;

    return gulp.src([src + '**/*.css', "!*.*", "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*", "!" + src + "vendor/**/*"])
        .pipe(newer(out))
        .pipe(debug())
        .pipe(cleanCss())
        .pipe(gulp.dest(out));

}

//exports.css = gulp.series(cleanBuild, images, html, js, css);
exports.css = css;

// ASSETS processing
function assets() {

    const out = build;

    return gulp.src([src + '**/*', "!*", "!" + src + "**/*.{gif,jpg,png,svg,html,htm,js,css}", "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*", "!" + src + "vendor/**/*"])
        .pipe(newer(out))
        .pipe(debug())
        .pipe(gulp.dest(out));

}

//exports.assets = gulp.series(cleanBuild, images, html, js, css, assets);
exports.assets = assets;

// watch for file changes
function watch(done) {

    // image changes
    gulp.watch([src + '**/*.{gif,jpg,png,svg}', "!*.*", "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*"], images);

    // html changes
    gulp.watch([src + '**/*.{html,htm}', "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*"], html);

    // css changes
    gulp.watch([src + '**/*.css', "!*.*", "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*"], css);

    // js changes
    gulp.watch([src + '**/*.js', "!*.*", "!" + src + "**/*min.js", "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*"], js);
    gulp.watch([src + '**/*min.js', "!*.*", "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*"], jsMin);

    // assets changes
    gulp.watch([src + '**/*', "!*", "!" + src + "**/*.{gif,jpg,png,svg,html,htm,js,css}", "!" + src + "node_modules/**/*", "!" + src + "testing/**/*", "!" + src + "build/**/*"], js);

    done();

}

exports.watch = watch;

exports.cleanDebug = gulp.series(cleanBuild, gulp.parallel(images, html, jsDebug, json, vendor, css, assets));
exports.clean = gulp.series(cleanBuild, gulp.parallel(images, html, js, json, vendor, css, assets));

exports.build = gulp.parallel(images, html, js, json, vendor, css, assets);

exports.watcher = gulp.series(exports.build, exports.watch);
exports.default = build;