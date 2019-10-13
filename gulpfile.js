/**
 * Gulpfile for this project
 *
 * Gulp uses configuration variables stored in `./configuration.yaml`
 *
 * @module gulpfile
 * @requires module:gulp/build
 * @requires module:gulp/lint
 * @requires module:gulp/server
 * @requires module:gulp/tests
 * @requires module:gulp/watch
 * @requires module:lib/config
 */

'use strict';

/* c8 ignore next 3 */
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

require('./gulp/build');
require('./gulp/lint');
require('./gulp/server');
require('./gulp/tests');
require('./gulp/watch');

const gulp = require('gulp'),
  sequence = require('gulp-sequence'),
  config = require('./lib/config');

/**
 * Default task
 *
 * start build and watch, some needed for changedInPlace dryrun
 *
 * @name module:gulpfile.default
 * @param {function} callback - gulp callback to signal end of task
 */
/* c8 ignore next 6 */
gulp.task('default', (callback) => {
  sequence(
    ...config.gulp.start[process.env.NODE_ENV].gulp,
    callback
  );
});
