/**
 * ## Gulp watch task
 *
 * @module gulp/watch
 */
'use strict'

const gulp = require('gulp')
const config = require('../lib/config')
const loadTasks = require('./lib/load-tasks')
const log = require('../lib/log')

const tasks = {
  /**
   * ### watch
   *
   * watch and execute tasks when files changed
   *
   * @task watch
   * @namespace tasks
   */
  'watch': () => {
    const tasks = loadTasks.tasks()
    for (let task in config.gulp.watch) {
      if (config.gulp.watch.hasOwnProperty(task)) {
        if (tasks.indexOf(task) >= 0) {
          gulp.watch(config.gulpWatch(task), [task])
          log.info('Task "' + task + '" is watching: [ ' +
            config.gulp.watch[task].join(', ') + ' ]')
        }
      }
    }
  }
}

loadTasks.importTasks(tasks)
