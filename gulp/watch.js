/**
 * ## Gulp watch task
 *
 * @module gulp/watch
 * @requires module:lib/config
 * @requires module:lib/log
 * @requires module:gulp/lib/load-tasks
 */

'use strict';

const { watch } = require('gulp'),
  glob = require('glob'),
  config = require('../lib/config'),
  log = require('../lib/log');

const gulpTasks = {
  ...require('./build'),
  ...require('./lint'),
  ...require('./server'),
  ...require('./tests')
};

const tasks = {
  /**
   * Watch and execute tasks when files changed for all tasks configured for current `NODE_ENV` setting
   *
   * @function watch
   */
  /* c8 ignore next 19 */
  'watch': (callback) => {
    global.gulpStatus.isWatching = true;

    const watchTasks = config.gulp.start[process.env.NODE_ENV].watch
      .reduce((obj, key) => {
        return {
          ...obj,
          [key]: tasks[key]
        };
      }, {});

    for (let task in watchTasks) {
      if (config.gulp.watch.hasOwnProperty(task)) {
        log.info('Task "' + task + '" is watching: ' + config.gulp.watch[task].join(', '));
        watch(config.gulp.watch[task], { events: 'all', ignoreInitial: true }, gulpTasks[task]);
      }
    }
    callback();
  }
};

let moduleTasks = [];
/**
 * Load gulp watch from modules
 *
 * @name module_gulp_loader
 */
glob.sync(config.server.modules + '/*/gulp/watch.js')
  .forEach((filename) => {
    moduleTasks.push(require('.' + filename));
  });

module.exports = Object.assign({}, tasks, ...moduleTasks);
