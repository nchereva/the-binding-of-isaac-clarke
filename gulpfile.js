var gulp = require('gulp'),
  gutil = require('gulp-util'),
  rimraf = require('gulp-rimraf'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  minifycss = require('gulp-minify-css'),
  minifyhtml = require('gulp-minify-html'),
  processhtml = require('gulp-processhtml'),
  jshint = require('gulp-jshint'),
  streamify = require('gulp-streamify'),
  uglify = require('gulp-uglify'),
  connect = require('gulp-connect'),
  source = require('vinyl-source-stream'),
  browserify = require('browserify'),
  watchify = require('watchify'),
  gulpif = require('gulp-if'),
  plumber = require('gulp-plumber'),
  combiner = require('stream-combiner2'),
  paths;

var browserSync = require('browser-sync');

var watching = false;

paths = {
  assets: 'src/assets/**/*',
  css: 'src/css/*.css',
  libs: [
    './node_modules/phaser/build/phaser.js'
  ],
  js: ['src/js/*.js', 'src/js/**/*.js'],
  entry: './src/js/main.js',
  dist: './dist/'
};

gulp.task('server', function() {
  browserSync({
    server: {
      baseDir: paths.dist
    },
    port: 9001
  });
});

// Reload all Browsers
gulp.task('bs-reload', ['build'], function() {
  browserSync.reload();
});



gulp.task('clean', function() {
  return gulp.src(paths.dist, {
      read: false
    })
    .pipe(rimraf({
      force: true
    }))
    .on('error', gutil.log);
});

gulp.task('copy', ['clean'], function() {
  gulp.src(paths.assets)
    .pipe(gulp.dest(paths.dist + 'assets'))
    .on('error', gutil.log);
});

gulp.task('copylibs', ['clean'], function() {
  gulp.src(paths.libs)
    .pipe(gulpif(!watching, uglify({
      outSourceMaps: false
    })))
    .pipe(gulp.dest(paths.dist + 'js/lib'))
    .on('error', gutil.log);
});

gulp.task('compile', ['clean'], function() {
  var bundler = browserify({
    cache: {},
    packageCache: {},
    fullPaths: true,
    entries: [paths.entry],
    debug: watching
  });

  // [
  //    gulp.src('bootstrap/js/*.js'),
  //    uglify(),
  //    gulp.dest('public/bootstrap')
  //  ]

  // any errors in the above streams will get caught
  // by this listener, instead of being thrown:
  // .on('error', function(err) {
  //         gutil.log(err.message);
  //         this.end();
  //       })
  var combined = combiner.obj(
    bundler.bundle(),
    plumber(),
    source('main.min.js'),
    jshint('.jshintrc'),
    jshint.reporter('default'),
    gulpif(!watching, streamify(uglify({
      outSourceMaps: false
    }))),
    gulp.dest(paths.dist));

  combined.on('error', gutil.log);


  // if (watching) {
  //   bundler = watchify(bundler);
  //   bundler.on('update', bundlee)
  // }

  // return bundlee();

  return combined;
});

gulp.task('minifycss', ['clean'], function() {
  gulp.src(paths.css)
    .pipe(gulpif(!watching, minifycss({
      keepSpecialComments: false,
      removeEmpty: true
    })))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log);
});

gulp.task('processhtml', ['clean'], function() {
  return gulp.src('src/index.html')
    .pipe(processhtml('index.html'))
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log);
});

gulp.task('minifyhtml', ['processhtml'], function() {
  gulp.src('dist/index.html')
    .pipe(gulpif(!watching, minifyhtml()))
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log);
});

gulp.task('html', ['build'], function() {
  gulp.src('dist/*.html')
    .pipe(browserSync.reload({
      stream: true
    }))
    .on('error', gutil.log);
});

// gulp.task('connect', function() {
//   connect.server({
//     root: ['./dist'],
//     port: 9876,
//     livereload: true
//   });
// });

gulp.task('watch', function() {
  watching = true;
  gulp.watch(['./src/index.html', paths.css,paths.js], ['bs-reload']);
});

gulp.task('default', ['server', 'watch', 'build']);
gulp.task('build', ['clean', 'copy', 'copylibs', 'compile', 'minifycss', 'processhtml', 'minifyhtml']);