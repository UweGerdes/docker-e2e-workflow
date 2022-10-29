/**
 * Gulp tasks for generation of compiled sources
 *
 * @module gulp/build
 * @requires module:lib/config
 * @requires module:lib/files-promises
 * @requires module:gulp/lib/load-tasks
 * @requires module:gulp/lib/notify
 * @requires module:gulp/lint
 */

'use strict';

const gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  gulpJsdoc = require('gulp-jsdoc3'),
  gulpLess = require('gulp-less'),
  mergeTranslations = require('gulp-merge-translations'),
  rename = require('gulp-rename'),
  gulpStreamToPromise = require('gulp-stream-to-promise'),
  glob = require('glob'),
  gulpTouch = require('./lib/gulp-vinyl-touch'),
  lessPluginGlob = require('less-plugin-glob'),
  config = require('../lib/config'),
  filePromises = require('../lib/files-promises'),
  notify = require('./lib/notify'),
  lint = require('./lint');

const tasks = {
  /**
   * Compile less files
   *
   * @function less
   */
  'less': gulp.series(lint.lesshint, function less() {
    return gulp.src(config.gulp.build.less.src)
      .pipe(gulpLess({
        plugins: [lessPluginGlob]
      }))
      .pipe(autoprefixer('last 3 version', 'safari 5', 'ie 8', 'ie 9', 'ios 6', 'android 4'))
      .pipe(rename(path => {
        path.dirname = path.dirname.replace(/\/less$/, '');
        return path;
      }))
      .pipe(gulpTouch())
      .pipe(gulp.dest(config.gulp.build.less.dest))
      .pipe(notify({ message: 'written: <%= file.path %>', title: 'Gulp less' }));
  }),
  /**
   * Compile js files
   *
   * @function js
   */
  'js': gulp.series(lint.eslint, function js(callback) {
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
              .pipe(gulpTouch())
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
  }),
  /**
   * Compile locales files
   *
   * @function locales
   */
  'locales': gulp.series(lint.localesjsonlint, function locales() {
    return gulp.src(config.gulp.watch.locales)
      .pipe(mergeTranslations('', {
        sep: '',
        jsonSpace: '  '
      }))
      .pipe(gulp.dest(config.gulp.build.locales.dest))
      .pipe(notify({ message: 'written: <%= file.path %>', title: 'Gulp locales' }));
  }),
  /**
   * Compile jsdoc
   *
   * @function jsdoc
   * @param {function} callback - gulp callback to signal end of task
   */
  'jsdoc': (callback) => {
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
      .pipe(gulpJsdoc(jsdocConfig, callback));
  },
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

let moduleTasks = [];
/**
 * Load gulp build from modules
 *
 * @name module_gulp_loader
 */
glob.sync(config.server.modules + '/*/gulp/build.js')
  .forEach((filename) => {
    moduleTasks.push(require('.' + filename));
  });

module.exports = Object.assign({}, tasks, ...moduleTasks);
