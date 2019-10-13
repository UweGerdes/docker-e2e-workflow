/**
 * Wrapper for gulp-notify
 *
 * @module gulp/lib/notify
 */

'use strict';

const gulpNotify = require('gulp-notify');

/**
 * Log only to console, not GUI
 *
 * @param {pbject} options - options
 * @param {function} callback - gulp callback to signal end of task
 * @type {function}
 */
const notify = gulpNotify.withReporter((options, callback) => {
  callback();
});

module.exports = notify;
