var gulp      = require('gulp');
var plumber   = require('gulp-plumber');
var webserver = require('gulp-webserver');
var opn       = require('opn');

var sourcePaths = {
  js: ['*.js']
};

var server = {
  host: 'localhost',
  port: '9001'
}

gulp.task('webserver', function() {
  gulp.src( '.' )
    .pipe(webserver({
      host:             server.host,
      port:             server.port,
      livereload:       true,
      directoryListing: false
    }));
});

gulp.task('openbrowser', function() {
  opn( 'http://' + server.host + ':' + server.port );
});

gulp.task('watch', function(){
  gulp.watch(sourcePaths.styles, ['sass']);
});

gulp.task('default', ['webserver', 'watch', 'openbrowser']);
