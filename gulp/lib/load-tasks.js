/**
 * Helper for task loading
 *
 * @module gulp/lib/load-tasks
 */

'use strict';

const gulp = require('gulp');

let list = [];

module.exports = {
  /**
   * Import tasks provided as an object into gulp
   *
   * @param {object} tasks - task list
   */
  importTasks: (tasks) => {
    Object.keys(tasks)
      .forEach((task) => {
        if (typeof tasks[task] == 'function') {
          gulp.task(task, tasks[task]);
        } else {
          gulp.task(task, tasks[task][0], tasks[task][1]);
        }
        list.push(task);
      });
  },
  /**
   * Get the task list
   *
   * @return {Array} task list
   */
  /* c8 ignore next 3 */
  tasks: () => {
    return list;
  }
};
