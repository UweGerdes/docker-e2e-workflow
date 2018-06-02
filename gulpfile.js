/**
 * gulpfile for e2e-workflow
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */
'use strict';

const exec = require('child_process').exec,
  del = require('del'),
  fs = require('fs'),
  glob = require('glob'),
  gulp = require('gulp'),
  changedInPlace = require('gulp-changed-in-place'),
  jscs = require('gulp-jscs'),
  jscsStylish = require('gulp-jscs-stylish'),
  jshint = require('gulp-jshint'),
  jsonlint = require('gulp-jsonlint'),
  path = require('path'),
  runSequence = require('run-sequence')
  ;

const baseDir = __dirname;

let watchFilesFor = {},
  verbose = false;

watchFilesFor.jshint = [
  path.join(baseDir, '*.js')
];
/**
 * jshint: javascript files
 */
gulp.task('jshint', () => {
  return gulp.src(watchFilesFor.jshint)
    .pipe(changedInPlace({ howToDetermineDifference: 'modification-time' }))
    .pipe(jshint())
    .pipe(jscs())
    .pipe(jscsStylish.combineWithHintResults())
    .pipe(jshint.reporter('jshint-stylish'))
    ;
});

watchFilesFor.jsonlint = [
  path.join(baseDir, '.jshintrc'),
  path.join(baseDir, '.jscsrc'),
  path.join(baseDir, '*.json')
];
/**
 * jsonlint: lint json files
 */
gulp.task('jsonlint', () => {
  return gulp.src(watchFilesFor.jsonlint)
    .pipe(jsonlint())
    .pipe(jsonlint.reporter())
    ;
});

watchFilesFor['teststeps-neukunde_2018_acteamBASIS'] = [
//  path.join(baseDir, 'config', 'neukunde_2018_acteamBASIS.js'),
];
/**
 * e2e-workflow: acteam admin workflow lizenzvereinbarungStandard2018
 *
 * @param {function} callback - gulp callback
 */
gulp.task('teststeps-neukunde_2018_acteamBASIS', function (callback) {
  del([
      path.join(baseDir, 'results', 'neukunde_2018_acteamBASIS', '*')
    ], { force: true });
  const loader = exec('casperjs test index.js --cfg=config/neukunde_2018_acteamBASIS.js',
    { cwd: baseDir });
  loader.stdout.on('data', (data) => { // jscs:ignore jsDoc
    if (!data.match(/PASS/) || verbose) { console.log(data.trim()); }
  });
  loader.stderr.on('data', (data) => { // jscs:ignore jsDoc
    console.log('stderr: ' + data.toString().trim());
  });
  loader.on('error', (err) => { // jscs:ignore jsDoc
    console.log('error: ' + err.toString().trim());
  });
  loader.on('close', (code) => { // jscs:ignore jsDoc
    if (code > 0) {
      console.log('teststeps-neukunde_2018_acteamBASIS exit-code: ' + code);
    }
    callback();
  });
});

watchFilesFor['e2e-workflow-default'] = [
  //path.join(baseDir, 'config', 'default.js'),
  //path.join(baseDir, 'index.js'),
  //path.join(baseDir, 'bin', 'load-page-styles.js'),
  //path.join(baseDir, 'bin', 'style-tree.js')
];
/**
 * e2e-workflow-default: test task
 *
 * @param {function} callback - gulp callback
 */
gulp.task('e2e-workflow-default', (callback) => {
  const resultsDir = path.join('results', 'default');
  del([
      path.join(baseDir, resultsDir, '*')
    ], { force: true });
  const loader = exec('casperjs test index.js --cfg=config/default.js', { cwd: baseDir });
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
      console.log('e2e-workflow-default exit-code: ' + code);
    }
    callback();
  });
});

watchFilesFor['test-e2e-workflow'] = [
  //  path.join(baseDir, 'config', '*.js')
  path.join(baseDir, 'config', 'modules', '**', 'tests', 'e2e-workflow', '*.js')
];
/**
 * #### testing
 *
 * @param {function} callback - gulp callback
 */
gulp.task('test-e2e-workflow', ['jshint'], (callback) => {
  getRecentFile(watchFilesFor['test-e2e-workflow'])
  .then(getConfig)
  .then(getRequest)
  .then(() => { // jscs:ignore jsDoc
    callback();
  })
  .catch((error) => { // jscs:ignore jsDoc
    console.error('Failed!', error);
    callback();
  });
});

/**
 * get newest file from glob list
 *
 * @param {array} paths - list with glob paths
 */
function getRecentFile(paths) {
  let newest = null;
  let bestTime = 0;
  paths.forEach((path) => { // jscs:ignore jsDoc
    const files = glob.sync(path);
    for (let i = 0; i < files.length; i++) {
      const fileTime = fs.statSync(files[i]).mtime.getTime();
      if (fileTime > bestTime) {
        newest = files[i];
        bestTime = fileTime;
      }
    }
  });
  return new Promise((resolve) => { // jscs:ignore jsDoc
    resolve(newest);
  });
}

/**
 * get config for file
 *
 * @param {array} file - list with glob paths
 */
function getConfig(file) {
  return new Promise((resolve, reject) => { // jscs:ignore jsDoc
    const regex = /^.*?(config\/modules\/.+?)\/(?:tests\/e2e-workflow|[^/]+)\/([^/]+)\..+$/;
    const match = regex.exec(file);
    const configFile = match[1] + '/tests/e2e-workflow/' + match[2] + '.js';
    if (!fs.existsSync(configFile)) {
      reject('no e2e-workflow configfile for ' + configFile);
    }
    try {
      const config = require('./' + configFile);
      resolve([configFile, config]);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * get request for config
 *
 * @param {array} data - configFilename and test configuration
 */
function getRequest(data) {
  const configFile = data[0],
    config = data[1];
  return new Promise((resolve, reject) => { // jscs:ignore jsDoc
    del([
      path.join(baseDir, config.dumpDir, '*')
    ], { force: true });
    const loader = exec('casperjs test index.js --cfg=' + configFile,
      { cwd: baseDir });
    loader.stdout.on('data', (data) => { // jscs:ignore jsDoc
      if (!data.match(/PASS/) || verbose) { console.log(data.trim()); }
    });
    loader.stderr.on('data', (data) => { // jscs:ignore jsDoc
      console.log('stderr: ' + data.toString().trim());
    });
    loader.on('error', (err) => { // jscs:ignore jsDoc
      console.log('error: ' + err.toString().trim());
    });
    loader.on('close', (code) => { // jscs:ignore jsDoc
      if (code > 0) {
        console.log('e2e-workflow-default exit-code: ' + code);
        reject('e2e-workflow-default exit-code: ' + code + ', start verbose to see more');
      }
      resolve(data);
    });
  });
}

/**
 * build: run all build tasks
 *
 * @param {function} callback - gulp callback
 */
gulp.task('build', (callback) => {
  runSequence(
    'jshint',
    'jsonlint',
    callback);
});

/**
 * watch: everything in watchFilesFor
 */
gulp.task('watch', () => {
  Object.keys(watchFilesFor).forEach((task) => { // jscs:ignore jsDoc
    watchFilesFor[task].forEach((filename) => { // jscs:ignore jsDoc
      glob(filename, (err, files) => { // jscs:ignore jsDoc
        if (err) {
          console.log(filename + ' error: ' + JSON.stringify(err, null, 4));
        }
        if (files.length === 0) {
          console.log(filename + ' not found');
        }
      });
    });
    gulp.watch(watchFilesFor[task], [task]);
  });
});

/**
 * default: run all build tasks and watch
 *
 * @param {function} callback - gulp callback
 */
gulp.task('default', (callback) => {
  runSequence(
    'build',
    'watch',
    callback);
});

module.exports = {
  gulp: gulp,
  watchFilesFor: watchFilesFor
};
