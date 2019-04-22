/**
 * @module lib:helpers
 * @private
 */
'use strict'

const gulp = require('gulp')
let list = []

module.exports = {
  /**
   * Import tasks provided as an object into gulp
   *
   * @param {object} tasks - task list
   */
  importTasks: (tasks) => {
    Object.keys(tasks)
      .forEach((task) => {
        if (typeof tasks[task] === 'function') {
          gulp.task(task, tasks[task])
        } else {
          gulp.task(task, tasks[task][0], tasks[task][1])
        }
        list.push(task)
      })
  },
  /**
   * get the task list
   *
   * @param {object} tasks - task list
   */
  tasks: () => list
}
