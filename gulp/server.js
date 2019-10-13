/**
 * Gulp server tasks
 *
 * @module gulp/server
 * @requires module:lib/config
 * @requires module:lib/ipv4addresses
 * @requires module:lib/log
 * @requires module:gulp/lib/load-tasks
 * @requires module:gulp/lib/notify
 */

'use strict';

const fs = require('fs'),
  gulp = require('gulp'),
  changedInPlace = require('gulp-changed-in-place'),
  server = require('gulp-develop-server'),
  livereload = require('gulp-livereload'),
  sequence = require('gulp-sequence'),
  path = require('path'),
  config = require('../lib/config'),
  ipv4addresses = require('../lib/ipv4addresses'),
  loadTasks = require('./lib/load-tasks'),
  log = require('../lib/log'),
  notify = require('./lib/notify');


const tasks = {
  /**
   * Start all configured server tasks for current NODE_ENV setting
   *
   * @function server
   * @param {function} callback - gulp callback to signal end of task
   */
  /* c8 ignore next 6 */
  'server': [['eslint'], (callback) => {
    sequence(
      ...config.gulp.start[process.env.NODE_ENV].server,
      callback
    );
  }],
  /**
   * Server start task
   *
   * @function server-start
   * @param {function} callback - gulp callback to signal end of task
   */
  /* c8 ignore next 8 */
  'server-start': (callback) => {
    server.listen({
      path: config.server.server,
      env: { VERBOSE: true, FORCE_COLOR: 1 },
      delay: 9000
    },
    callback);
  },
  /**
   * Server changed task restarts server
   *
   * @function server-changed
   * @param {function} callback - gulp callback to signal end of task
   */
  /* c8 ignore next 8 */
  'server-changed': (callback) => {
    server.changed((error) => {
      if (!error) {
        livereload.changed({ path: '/', quiet: false });
      }
      callback();
    });
  },
  /**
   * Server livereload task notifies clients
   *
   * @function livereload
   */
  /* c8 ignore next 6 */
  'livereload': () => {
    return gulp.src(config.gulp.watch.livereload)
      .pipe(changedInPlace({ howToDetermineDifference: 'modification-time' }))
      .pipe(notify({ message: '<%= file.path %>', title: 'livereload' }))
      .pipe(livereload({ quiet: false }));
  },
  /**
   * Trigger of livereload task with first file configured for livereload
   *
   * used for full page reload if js or locales change
   *
   * @function livereload-all
   */
  /* c8 ignore next 5 */
  'livereload-all': () => {
    return gulp.src(config.gulp.watch.livereload[0])
      .pipe(notify({ message: 'triggered', title: 'livereload' }))
      .pipe(livereload({ quiet: false }));
  },
  /**
   * Livereload server start task
   *
   * @function livereload-start
   */
  /* c8 ignore next 10 */
  'livereload-start': () => {
    livereload.listen({
      host: ipv4addresses.get()[0],
      port: '8081',
      quiet: false,
      key: fs.readFileSync(path.join(__dirname, '..', config.server.httpsKey)),
      cert: fs.readFileSync(path.join(__dirname, '..', config.server.httpsCert))
    });
    log.info('livereload listening on http://' + ipv4addresses.get()[0] + ':' + process.env.LIVERELOAD_PORT);
  }
};

loadTasks.importTasks(tasks);
