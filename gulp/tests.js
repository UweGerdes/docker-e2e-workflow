/**
 * ## Gulp test tasks
 *
 * @module gulp/test
 */
'use strict';

const exec = require('child_process').exec,
  del = require('del'),
  sequence = require('gulp-sequence'),
  path = require('path'),
  config = require('../lib/config'),
  loadTasks = require('./lib/load-tasks')
  ;

const tasks = {
  /**
   * ### test-e2e-workflow-default and livereload
   *
   * @task test-e2e-workflow-default
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-default': (callback) => {
    sequence(
      'test-e2e-workflow-default-exec',
      'livereload',
      callback
    );
  },

  /**
   * ### e2e-workflow-default-exec: test task
   *
   * @task test-e2e-workflow-default
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'test-e2e-workflow-default-exec': (callback) => {
    const baseDir = path.join(__dirname, '..');
    const resultsDir = path.join(baseDir, 'results', 'default');
    del([
        path.join(resultsDir, '*')
      ], { force: true });
    const loader = exec('node index.js --cfg=' + config.gulp.tests['test-e2e-workflow-default'],
      { cwd: baseDir });
    loader.stdout.on('data', (data) => { // jscs:ignore jsDoc
      console.log(data.toString().trim());
    });
    loader.stderr.on('data', (data) => { // jscs:ignore jsDoc
      console.log('stderr: ' + data.toString().trim());
    });
    loader.on('error', (err) => { // jscs:ignore jsDoc
      console.log('error: ' + err.toString().trim());
    });
    loader.on('close', (code) => { // jscs:ignore jsDoc
      if (code > 0) {
        console.log('test-e2e-workflow-default exit-code: ' + code);
      }
      callback();
    });
  }
};

loadTasks.importTasks(tasks);
