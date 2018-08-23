/**
 * @module gulp/lint
 */
'use strict'

const gulp = require('gulp')
const cache = require('gulp-cached')
const changedInPlace = require('gulp-changed-in-place')
const jscs = require('gulp-jscs')
const jscsStylish = require('gulp-jscs-stylish')
const gulpJshint = require('gulp-jshint')
const jsonlint = require('gulp-jsonlint')
const lesshint = require('gulp-lesshint')
const pugLinter = require('gulp-pug-linter')
const sequence = require('gulp-sequence')
const standard = require('gulp-standard')
const yamlValidate = require('gulp-yaml-validate')
const config = require('../lib/config')
const loadTasks = require('./lib/load-tasks')

const tasks = {
  /**
   * ### Default gulp lint task
   *
   * @task lint
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'lint': (callback) => {
    sequence(
      'jshint',
      'jsonlint',
      // 'lesshint', // executed by less task
      'yamllint',
      'puglint',
      callback
    )
  },
  /**
   * #### Lint js files
   *
   * apply jshint and jscs to js files
   *
   * @task jshint
   * @namespace tasks
   */
  'jshint': () => {
    return gulp.src(config.gulp.watch.jshint)
      .pipe(changedInPlace({ howToDetermineDifference: 'modification-time' }))
      .pipe(gulpJshint())
      .pipe(jscs())
      .pipe(jscsStylish.combineWithHintResults())
      .pipe(gulpJshint.reporter('default'))
      .pipe(gulpJshint.reporter('fail'))
      // .pipe(gulpJshint.reporter('jshint-stylish'))
  },
  /**
   * #### Lint js files
   *
   * apply jsstandard to js files
   *
   * @task jsstandard
   * @namespace tasks
   */
  'jsstandard': () => gulp.src(config.gulp.watch.jsstandard)
    .pipe(cache('jsstandard'))
    // .pipe(log({ message: 'linting: <%= file.path %>', title: 'Gulp jsstandard' }))
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: true
    })),
  /**
   * #### Lint json files
   *
   * apply lesshint json files
   *
   * @task jsonlint
   * @namespace tasks
   */
  'jsonlint': () => {
    return gulp.src(config.gulp.watch.jsonlint)
      .pipe(jsonlint())
      .pipe(jsonlint.reporter())
  },
  /**
   * #### Lint less files
   *
   * apply lesshint to less files
   *
   * @task lesshint
   * @namespace tasks
   */
  'lesshint': () => {
    return gulp.src(config.gulp.watch.less)
      .pipe(lesshint())
      // .on('error', function () {})
      .pipe(lesshint.reporter())
      .pipe(lesshint.failOnError())
  },
  /**
   * #### Lint yaml files
   *
   * apply yamlValidate to yaml files
   *
   * @task yamllint
   * @namespace tasks
   */
  'yamllint': () => {
    return gulp.src(config.gulp.watch.yamllint)
      .pipe(yamlValidate({ space: 2 }))
      .on('error', (msg) => {
        console.log(msg)
      })
  },
  /**
   * #### Lint pug files
   *
   * apply pug-linter to pug files
   *
   * @task puglint
   * @namespace tasks
   */
  'puglint': () => {
    return gulp.src(config.gulp.watch.puglint)
      .pipe(pugLinter())
      .pipe(pugLinter.reporter('fail'))
  }
}

loadTasks.importTasks(tasks)
