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
 * @requires module:lib/log
 */

'use strict';

global.gulpStatus = { isWatching: false };

const { series } = require('gulp'),
  config = require('./lib/config');

const tasks = {
  ...require('./gulp/build'),
  ...require('./gulp/lint'),
  ...require('./gulp/tests'),
  ...require('./gulp/server'),
  ...require('./gulp/watch')
};
/* c8 ignore next 3 */
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

/**
 * Start all configured tasks for current `NODE_ENV` setting
 *
 * @function server
 * @param {function} callback - gulp callback to signal end of task
 */
Object.keys(config.gulp.start[process.env.NODE_ENV])
  .forEach((group) => {
    const myTasks = Object.keys(tasks)
      .filter(key => config.gulp.start[process.env.NODE_ENV][group].includes(key))
      .reduce((obj, key) => {
        return {
          ...obj,
          [key]: tasks[key]
        };
      }, {});
    tasks[group] = series(...Object.values(myTasks));
  });

module.exports = tasks;
