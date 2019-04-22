/**
 * ## Gulp server tasks
 *
 * @module gulp/server
 */
'use strict'

const chalk = require('chalk')
const dateFormat = require('dateformat')
const gulp = require('gulp')
const server = require('gulp-develop-server')
const livereload = require('gulp-livereload')
const sequence = require('gulp-sequence')
const config = require('../lib/config')
const ipv4addresses = require('../lib/ipv4addresses.js')
const loadTasks = require('./lib/load-tasks')

const tasks = {
  /**
   * ### server start task
   *
   * @task server
   * @param {function} callback - gulp callback
   * @namespace tasks
   */
  'server': (callback) => {
    sequence(
      'livereload-start',
      'server-start',
      callback
    )
  },
  /**
   * ### server restart, triggered by watch
   *
   * @task server
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-restart': [['jsstandard'], (callback) => {
    sequence(
      'server-changed',
      'livereload',
      callback
    )
  }],
  /**
   * ### server livereload task
   *
   * @task livereload
   * @namespace tasks
   */
  'livereload': () => {
    console.log('[' + chalk.gray(dateFormat(new Date(), 'HH:MM:ss')) + '] ' + 'livereload triggered')
    return gulp.src(config.gulp.watch.livereload[0])
      .pipe(livereload())
  },
  /**
   * ### server start task
   *
   * @task server-start
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-start': (callback) => {
    server.listen({
      path: config.server.server,
      env: { VERBOSE: true, FORCE_COLOR: 1 }
    },
    callback)
  },
  /**
   * ### server restart task
   *
   * @task server-restart
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-changed': (callback) => {
    server.changed((error) => {
      if (!error) {
        livereload.changed({ path: '/', quiet: false })
      }
      callback()
    })
  },
  /**
   * ### server livereload start task
   *
   * @task livereload-start
   * @namespace tasks
   */
  'livereload-start': () => {
    livereload.listen({ port: config.server.livereloadPort, delay: 2000, quiet: true })
    console.log('[' + chalk.gray(dateFormat(new Date(), 'HH:MM:ss')) + '] ' +
      'livereload listening on http://' +
      ipv4addresses.get()[0] + ':' + config.server.livereloadPort)
  }
}

loadTasks.importTasks(tasks)
