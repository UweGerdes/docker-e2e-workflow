/**
 * gulpfile for e2e-workflow
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */
'use strict';

//require('./gulp/build');
require('./gulp/lint');
//require('./gulp/server');
require('./gulp/tests');
require('./gulp/watch');

const gulp = require('gulp'),
  sequence = require('gulp-sequence')
  ;

/**
 * #### default task
 *
 * start build and watch, some needed for changedInPlace dryrun
 *
 * @param {function} callback - gulp callback
 */
gulp.task('default', (callback) => {
  sequence(
    'lint',
//    'build',
    'watch',
//    'server',
//    'tests', // tests only triggered by watch
    callback);
});
