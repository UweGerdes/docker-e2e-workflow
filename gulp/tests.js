/**
 * Gulp test tasks
 *
 * @module gulp/tests
 * @requires module:lib/config
 * @requires module:lib/files-promises
 * @requires module:gulp/lib/load-tasks
 * @requires module:gulp/lib/notify
 */

'use strict';

const exec = require('child_process').exec,
  gulp = require('gulp'),
  mocha = require('gulp-mocha'),
  path = require('path'),
  sequence = require('gulp-sequence'),
  gulpStreamToPromise = require('gulp-stream-to-promise'),
  config = require('../lib/config'),
  files = require('../lib/files-promises'),
  loadTasks = require('./lib/load-tasks'),
  notify = require('./lib/notify');

const baseDir = path.join(__dirname, '..');

const tasks = {
  /**
   * Start all tests configured for current NODE_ENV setting
   *
   * @function test
   * @param {function} callback - gulp callback to signal end of task
   */
  'tests': (callback) => {
    sequence(
      ...config.gulp.start[process.env.NODE_ENV].tests,
      callback
    );
  },
  /**
   * Start all tests configured in configuration gulp.test.modules
   *
   * @function test-modules
   * @param {function} callback - gulp callback to signal end of task
   */
  'test-modules': [['eslint', 'ejslint'], (callback) => {
    Promise.all(config.gulp.tests.modules.map(files.getFilenames))
      .then((filenames) => [].concat(...filenames))
      .then(files.getRecentFiles)
      .then((filenames) => {
        const task = gulp.src(filenames, { read: false })
          // `gulp-mocha` needs filepaths so you can't have any plugins before it
          .pipe(mocha({ reporter: 'tap', timeout: 10000 })) // timeout for Raspberry Pi 3
          /* c8 ignore next 3 */
          .on('error', function (error) {
            task.emit(error);
          })
          .pipe(notify({ message: 'tested: <%= file.path %>', title: 'Gulp test' }));
        return gulpStreamToPromise(task);
      })
      .then(() => {
        callback();
      })
      .catch(err => console.log(err));
  }],
  /**
   * ### test-e2e-workflow-default and livereload
   *
   * @task test-e2e-workflow-default
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-default': [['eslint'], (callback) => {
    sequence(
      'test-e2e-workflow-default-exec',
      'livereload',
      callback
    );
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
      'node modules/e2e/server/lib/index.js --cfg=' + config.gulp.tests['test-e2e-workflow-default'][0],
    { cwd: baseDir });
    loader.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    loader.stderr.on('data', (data) => {
      console.log('stderr: ' + data.toString().trim());
    });
    loader.on('error', (err) => {
      console.log('error: ' + err.toString().trim());
    });
    loader.on('close', (code) => {
      if (code > 0) {
        console.log('test-e2e-workflow-default exit-code: ' + code);
      }
      callback();
    });
  },
  /**
   * ### test-e2e-workflow-modules and livereload
   *
   * @task test-e2e-workflow-modules
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-modules': [['eslint'], (callback) => {
    sequence(
      'test-e2e-workflow-modules-exec',
      'livereload',
      callback
    );
  }],
  /**
   * ### test-e2e-workflow-modules test task
   *
   * @task test-e2e-workflow-modules-exec
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-modules-exec': async () => {
    let filenames = [];
    const promises = config.gulp.tests['test-e2e-workflow-modules'].forEach((path) => {
      return files.getFilenames(path);
    });
    filenames = await files.getRecentFiles(await Promise.all(promises));
    const runs = filenames.forEach((filename) => {
      return runModule(filename);
    });
    await Promise.all(runs);
  }
};

/**
 * start module test
 *
 * @param {array} files - list with glob paths
 */
function runModule (filename) {
  return new Promise((resolve, reject) => {
    const loader = exec('export FORCE_COLOR=1; ' +
      'node modules/e2e/server/lib/index.js --cfg=' + filename,
    { cwd: baseDir });
    loader.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    loader.stderr.on('data', (data) => {
      console.log('stderr: ' + data.toString().trim());
    });
    loader.on('error', (err) => {
      console.log('error: ' + err.toString().trim());
    });
    loader.on('close', (code) => {
      if (code > 0) {
        console.log('test-e2e-workflow-default exit-code: ' + code);
        reject(new Error('test-e2e-workflow-default exit-code: ' + code));
      }
      resolve();
    });
  });
}

if (process.env.NODE_ENV === 'development') {
  loadTasks.importTasks(tasks);
} else {
  loadTasks.importTasks({
    'test-e2e-workflow-modules': tasks['test-e2e-workflow-modules'],
    'test-e2e-workflow-modules-exec': tasks['test-e2e-workflow-modules-exec']
  });
}
