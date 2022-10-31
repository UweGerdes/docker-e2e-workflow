/**
 * ## Gulp watch task
 *
 * @module gulp/watch
 * @requires module:lib/config
 * @requires module:lib/log
 * @requires module:gulp/lib/load-tasks
 */

'use strict';

const { series, watch } = require('gulp'),
  glob = require('glob'),
  config = require('../lib/config'),
  log = require('../lib/log');

const gulpTasks = {
  ...require('./build'),
  ...require('./lint'),
  ...require('./server'),
  ...require('./tests')
};

let tasks = {
  /**
   * Watch and execute tasks when files changed for all tasks configured for current `NODE_ENV` setting
   *
   * @function watch
   */
  /* c8 ignore next 19 */
  'watch': (callback) => {
    global.gulpStatus.isWatching = true;

    for (let task in gulpTasks) {
      if (config.gulp.watch.hasOwnProperty(task)) {
        log.info('Task "' + task + '" is watching: ' + config.gulp.watch[task].join(', '));
        watch(config.gulp.watch[task], { events: 'all', ignoreInitial: true }, gulpTasks[task]);
      }
    }

    Object.keys(config.gulp.start[process.env.NODE_ENV])
      .filter(group => config.gulp.watch.hasOwnProperty(group))
      .forEach((group) => {
        let taskSeries = [];
        config.gulp.start[process.env.NODE_ENV][group]
          .filter(key => gulpTasks.hasOwnProperty(key))
          .forEach((key) => {
            taskSeries.push(gulpTasks[key]);
          });
        log.info('Task "' + group + '" is watching: ' + config.gulp.watch[group].join(', '));
        watch(config.gulp.watch[group], { events: 'all', ignoreInitial: true }, series(...taskSeries));
      });
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
    let task = require('.' + filename);
    moduleTasks.push(task);
    tasks = Object.assign({}, tasks, task);
  });

module.exports = Object.assign({}, tasks, ...moduleTasks);
