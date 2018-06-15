/**
 * ## Gulp server tasks
 *
 * @module gulp/server
 */
'use strict';

const gulp = require('gulp'),
  server = require('gulp-develop-server'),
  livereload = require('gulp-livereload'),
  sequence = require('gulp-sequence'),
  config = require('../lib/config'),
  ipv4addresses = require('../lib/ipv4addresses.js'),
  loadTasks = require('./lib/load-tasks'),
  log = require('../lib/log')
  ;

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
    );
  },
  /**
   * ### server restart, triggered by watch
   *
   * @task server
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-restart': [['jshint'], (callback) => {
    sequence(
      'server-changed',
      callback
    );
  }],
  /**
   * ### server livereload task
   *
   * @task livereload
   * @namespace tasks
   */
  'livereload': () => {
    log.info('livereload triggered');
    return gulp.src(config.gulp.watch.livereload[0])
      .pipe(livereload())
      ;
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
      callback
    );
  },
  /**
   * ### server restart task
   *
   * @task server-restart
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-changed': (callback) => {
    server.changed((error) => { // jscs:ignore jsDoc
      if (!error) {
        livereload.changed({ path: '/', quiet: false });
      }
      callback();
    });
  },
  /**
   * ### server livereload start task
   *
   * @task livereload-start
   * @namespace tasks
   */
  'livereload-start': () => {
    livereload.listen({ port: config.server.livereloadPort, delay: 2000, quiet: true });
    log.info('livereload listening on http://' +
      ipv4addresses.get()[0] + ':' + config.server.livereloadPort);
  }
};

loadTasks.importTasks(tasks);
