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
  path = require('path'),
  glob = require('glob'),
  config = require('../lib/config'),
  ipv4addresses = require('../lib/ipv4addresses'),
  log = require('../lib/log'),
  notify = require('./lib/notify'),
  lint = require('./lint');

let tasks = {
  /**
   * Server start task
   *
   * @function server-start
   * @param {function} callback - gulp callback to signal end of task
   */
  /* c8 ignore next 8 */
  'server-start': (callback) => {
    server.listen(
      {
        path: config.server.server,
        env: { VERBOSE: true, FORCE_COLOR: 1 },
        delay: 9000
      },
      callback
    );
  },
  /**
   * Server changed task restarts server
   *
   * @function server-changed
   * @param {function} callback - gulp callback to signal end of task
   */
  /* c8 ignore next 8 */
  'server-changed': gulp.series(
    lint.eslint,
    function serverChanged(callback) {
      server.changed((error) => {
        if (!error) {
          livereload.changed({ path: '/', quiet: false });
        }
        callback();
      });
    }
  ),
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
  'livereload-start': (callback) => {
    livereload.listen({
      host: ipv4addresses.get()[0],
      port: '8081',
      quiet: false,
      key: fs.readFileSync(path.join(__dirname, '..', config.server.httpsKey)),
      cert: fs.readFileSync(path.join(__dirname, '..', config.server.httpsCert))
    });
    log.info('livereload listening on http://' + ipv4addresses.get()[0] + ':' + process.env.LIVERELOAD_PORT);
    callback();
  }
};

let moduleTasks = [];
/**
 * Load gulp server from modules
 *
 * @name module_gulp_loader
 */
glob.sync(config.server.modules + '/*/gulp/server.js')
  .forEach((filename) => {
    let task = require('.' + filename);
    moduleTasks.push(task);
    tasks = Object.assign({}, tasks, task);
  });

module.exports = Object.assign({}, tasks, ...moduleTasks);
