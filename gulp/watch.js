/**
 * ## Gulp watch task
 *
 * @module gulp/watch
 */
'use strict'

const chalk = require('chalk')
const dateFormat = require('dateformat')
const gulp = require('gulp')
const config = require('../lib/config')
const loadTasks = require('./lib/load-tasks')

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
          console.log('[' + chalk.gray(dateFormat(new Date(), 'HH:MM:ss')) + '] ' +
            'Task "' + task + '" is watching: [ ' +
            config.gulp.watch[task].join(', ') + ' ]')
        }
      }
    }
  }
}

loadTasks.importTasks(tasks)
