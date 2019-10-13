/**
 * ## Gulp watch task
 *
 * @module gulp/watch
 * @requires module:lib/config
 * @requires module:lib/log
 * @requires module:gulp/lib/load-tasks
 */

'use strict';

const gulp = require('gulp'),
  config = require('../lib/config'),
  log = require('../lib/log'),
  loadTasks = require('./lib/load-tasks');

const tasks = {
  /**
   * Watch and execute tasks when files changed for all tasks configured for current NODE_ENV setting
   *
   * @function watch
   */
  /* c8 ignore next 17 */
  'watch': () => {
    const tasks = loadTasks.tasks();
    let tasklist = config.gulp.watch;
    if (config.gulp.start[process.env.NODE_ENV] && config.gulp.start[process.env.NODE_ENV].watch) {
      tasklist = config.gulp.start[process.env.NODE_ENV].watch
        .reduce((obj, key) => ({ ...obj, [key]: config.gulp.watch[key] }), {});
    }
    for (let task in tasklist) {
      if (config.gulp.watch.hasOwnProperty(task)) {
        if (tasks.indexOf(task) >= 0) {
          gulp.watch(config.gulp.watch[task], [task]);
          log.info('Task "' + task + '" is watching: [ ' +
            config.gulp.watch[task].join(', ') + ' ]');
        }
      }
    }
  }
};

loadTasks.importTasks(tasks);
