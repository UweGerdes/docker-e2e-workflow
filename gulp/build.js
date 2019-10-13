/**
 * Gulp tasks for generation of compiled sources
 *
 * @module gulp/build
 * @requires module:lib/config
 * @requires module:lib/files-promises
 * @requires module:gulp/lib/load-tasks
 * @requires module:gulp/lib/notify
 */

'use strict';

const gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  jsdoc = require('gulp-jsdoc3'),
  less = require('gulp-less'),
  mergeTranslations = require('gulp-merge-translations'),
  rename = require('gulp-rename'),
  sequence = require('gulp-sequence'),
  gulpStreamToPromise = require('gulp-stream-to-promise'),
  lessPluginGlob = require('less-plugin-glob'),
  combiner = require('stream-combiner2'),
  config = require('../lib/config'),
  filePromises = require('../lib/files-promises'),
  loadTasks = require('./lib/load-tasks'),
  notify = require('./lib/notify');

const tasks = {
  /**
   * Default gulp build task
   *
   * Build all tasks configured for current NODE_ENV setting
   *
   * @function build
   * @param {function} callback - gulp callback to signal end of task
   */
  'build': (callback) => {
    sequence(
      ...config.gulp.start[process.env.NODE_ENV].build,
      callback
    );
  },
  /**
   * Compile less files
   *
   * @function less
   */
  'less': [['lesshint'], () => {
    return combiner.obj([
      gulp.src(config.gulp.build.less.src),
      less({
        plugins: [lessPluginGlob]
      }),
      autoprefixer('last 3 version', 'safari 5', 'ie 8', 'ie 9', 'ios 6', 'android 4'),
      rename(path => {
        path.dirname = path.dirname.replace(/\/less$/, '');
        return path;
      }),
      gulp.dest(config.gulp.build.less.dest),
      notify({ message: 'written: <%= file.path %>', title: 'Gulp less' })
    ])
      .on('error', () => { });
  }],
  /**
   * Compile js files
   *
   * @function js
   */
  'js': [['eslint'], (callback) => {
    Promise.all(config.gulp.build.js.src.map(filePromises.getFilenames))
      .then((filenames) => [].concat(...filenames))
      .then(filePromises.getRecentFiles)
      .then((filenames) => {
        const promises = [];
        for (const filename of filenames) {
          promises.push(gulpStreamToPromise(
            gulp.src(filename)
              .pipe(rename(function (path) {
                Object.keys(config.gulp.build.js.replace).forEach((key) => {
                  path.dirname = filename.replace(new RegExp(key), config.gulp.build.js.replace[key]);
                });
              }))
              .pipe(gulp.dest(config.gulp.build.js.dest))
              .pipe(notify({ message: 'written: <%= file.path %>', title: 'Gulp js' }))
          ));
        }
        return Promise.all(promises);
      })
      .then(() => {
        callback();
      })
      .catch(err => console.log(err));
  }],
  /**
   * Compile locales files
   *
   * @function locales
   */
  'locales': [['localesjsonlint'], () => {
    return gulp.src(config.gulp.watch.locales)
      .pipe(mergeTranslations('', {
        sep: '',
        jsonSpace: '  '
      }))
      .pipe(gulp.dest(config.gulp.build.locales.dest))
      .pipe(notify({ message: 'written: <%= file.path %>', title: 'Gulp locales' }));
  }],
  /**
   * Compile jsdoc
   *
   * @function jsdoc
   * @param {function} callback - gulp callback to signal end of task
   */
  'jsdoc': [['eslint'], (callback) => {
    const jsdocConfig = {
      'tags': {
        'allowUnknownTags': true
      },
      'opts': {
        'destination': config.gulp.build.jsdoc.dest
      },
      'plugins': [
        'plugins/markdown'
      ],
      'templates': {
        'cleverLinks': false,
        'monospaceLinks': false,
        'default': {
          'outputSourceFiles': 'true'
        },
        'path': 'ink-docstrap',
        'theme': 'cerulean',
        'navType': 'vertical',
        'linenums': true,
        'dateFormat': 'D.MM.YY, HH:mm:ss'
      }
    };
    gulp.src(config.gulp.build.jsdoc.src, { read: false })
      .pipe(jsdoc(jsdocConfig, callback));
  }],
  /**
   * Copy files to deploy
   *
   * @function deploy
   */
  'deploy': () => {
    return gulp.src(config.gulp.build.deploy.src, { 'base': '.' })
      .pipe(gulp.dest(config.gulp.build.deploy.dest))
      .pipe(notify({ message: 'written: <%= file.path %>', title: 'Gulp deploy' }));
  }
};

loadTasks.importTasks(tasks);
