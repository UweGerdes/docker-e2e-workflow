/**
 * Wrapper for gulp-notify
 *
 * @module gulp/lib/notify
 */

'use strict';

const gulpNotify = require('gulp-notify');

/**
 * Log notification only to console, not GUI
 *
 * @function notify
 * @param {pbject} options - reporter options, e.g. { message: 'text output', title: 'message title' }
 * @param {function} callback - gulp callback to signal end of task
 * @type {function}
 */
module.exports = gulpNotify.withReporter((options, callback) => {
  callback();
});
