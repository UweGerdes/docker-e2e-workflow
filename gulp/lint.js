/**
 * @module gulp/lint
 */
'use strict';

const gulp = require('gulp'),
  changedInPlace = require('gulp-changed-in-place'),
  jscs = require('gulp-jscs'),
  jscsStylish = require('gulp-jscs-stylish'),
  gulpJshint = require('gulp-jshint'),
  jsonlint = require('gulp-jsonlint'),
  lesshint = require('gulp-lesshint'),
  pugLinter = require('gulp-pug-linter'),
  sequence = require('gulp-sequence'),
  yamlValidate = require('gulp-yaml-validate'),
  config = require('../lib/config'),
  loadTasks = require('./lib/load-tasks')
  ;

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
      //'lesshint', // executed by less task
      'yamllint',
      'puglint',
      callback
    );
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
//      .pipe(gulpJshint.reporter('jshint-stylish'))
      ;
  },
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
      ;
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
      //.on('error', function () {})
      .pipe(lesshint.reporter())
      .pipe(lesshint.failOnError())
      ;
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
      .on('error', (msg) => { // jscs:ignore jsDoc
        console.log(msg);
      })
      ;
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
      ;
  },
};

loadTasks.importTasks(tasks);
