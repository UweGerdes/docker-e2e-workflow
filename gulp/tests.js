/**
 * ## Gulp test tasks
 *
 * @module gulp/test
 */
'use strict'

const exec = require('child_process').exec
const sequence = require('gulp-sequence')
const path = require('path')
const config = require('../lib/config')
const loadTasks = require('./lib/load-tasks')
const files = require('../lib/files')

const baseDir = path.join(__dirname, '..')

const tasks = {
  /**
   * ### test-e2e-workflow-default and livereload
   *
   * @task test-e2e-workflow-default
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-default': [['jsstandard'], (callback) => {
    sequence(
      'test-e2e-workflow-default-exec',
      'livereload',
      callback
    )
  }],

  /**
   * ### e2e-workflow-default-exec: test task
   *
   * @task test-e2e-workflow-default-exec
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-default-exec': (callback) => {
    const loader = exec('export FORCE_COLOR=1; ' +
      'node index.js --cfg=' + config.gulp.tests['test-e2e-workflow-default'][0],
    { cwd: baseDir })
    loader.stdout.on('data', (data) => {
      console.log(data.toString().trim())
    })
    loader.stderr.on('data', (data) => {
      console.log('stderr: ' + data.toString().trim())
    })
    loader.on('error', (err) => {
      console.log('error: ' + err.toString().trim())
    })
    loader.on('close', (code) => {
      if (code > 0) {
        console.log('test-e2e-workflow-default exit-code: ' + code)
      }
      callback()
    })
  },
  /**
   * ### test-e2e-workflow-modules and livereload
   *
   * @task test-e2e-workflow-modules
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-modules': [['jsstandard'], (callback) => {
    sequence(
      'test-e2e-workflow-modules-exec',
      'livereload',
      callback
    )
  }],

  /**
   * ### test-e2e-workflow-modules test task
   *
   * @task test-e2e-workflow-modules-exec
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-modules-exec': (callback) => {
    Promise.all(config.gulp.tests['test-e2e-workflow-modules'].map(files.getFilenames))
      .then((filenames) => [].concat(...filenames))
      .then(files.getRecentFiles)
      .then((filenames) => {
        return Promise.all(
          filenames.map(runModule)
        )
      })
      .then(() => { callback() })
  }
}

/**
 * start module test
 *
 * @param {array} files - list with glob paths
 */
const runModule = (filename) => {
  return new Promise((resolve, reject) => {
    const loader = exec('export FORCE_COLOR=1; ' +
      'node index.js --cfg=' + filename,
    { cwd: baseDir })
    loader.stdout.on('data', (data) => {
      console.log(data.toString().trim())
    })
    loader.stderr.on('data', (data) => {
      console.log('stderr: ' + data.toString().trim())
    })
    loader.on('error', (err) => {
      console.log('error: ' + err.toString().trim())
    })
    loader.on('close', (code) => {
      if (code > 0) {
        console.log('test-e2e-workflow-default exit-code: ' + code)
        reject(new Error('test-e2e-workflow-default exit-code: ' + code))
      }
      resolve()
    })
  })
}

loadTasks.importTasks(tasks)
