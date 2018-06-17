/**
 * ## Gulp test tasks
 *
 * @module gulp/test
 */
'use strict';

const exec = require('child_process').exec,
  glob = require('glob'),
  sequence = require('gulp-sequence'),
  path = require('path'),
  config = require('../lib/config'),
  loadTasks = require('./lib/load-tasks')
  ;

const baseDir = path.join(__dirname, '..');

const tasks = {
  /**
   * ### test-e2e-workflow-default and livereload
   *
   * @task test-e2e-workflow-default
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-default': [['jshint'], (callback) => {
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
      'node index.js --cfg=' + config.gulp.tests['test-e2e-workflow-default'],
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
   * ### e2e-workflow-modules test task
   *
   * @task test-e2e-workflow-modules
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-modules': () => {
    getFilenames(config.gulp.tests['test-e2e-workflow-modules'])
    .then((filenames) => {
      return Promise.all(
        filenames.map(runModule)
      );
    });
  }
};

/**
 * get list of files for glob pattern
 *
 * @private
 * @param {function} paths - patterns for paths
 */
const getFilenames = (path) => {
  return new Promise((resolve, reject) => {
    glob(path, (error, filenames) => {
      if (error) {
        reject(error);
      } else {
        resolve(filenames);
      }
    });
  });
};

const runModule = (filename) => {
  return new Promise((resolve, reject) => {
    const loader = exec('export FORCE_COLOR=1; ' +
      'node index.js --cfg=' + filename,
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
        reject();
      }
      resolve();
    });
  });
};

loadTasks.importTasks(tasks);
