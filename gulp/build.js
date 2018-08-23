/**
 * @module gulp/build
 */
'use strict'

const gulp = require('gulp')
const autoprefixer = require('gulp-autoprefixer')
const jsdoc = require('gulp-jsdoc3')
const less = require('gulp-less')
const notify = require('gulp-notify')
const rename = require('gulp-rename')
const sequence = require('gulp-sequence')
const lessPluginGlob = require('less-plugin-glob')
const combiner = require('stream-combiner2')
const config = require('../lib/config')
const loadTasks = require('./lib/load-tasks')

/**
 * log only to console, not GUI
 *
 * @param {pbject} options - setting options
 * @param {function} callback - gulp callback
 */
const log = notify.withReporter((options, callback) => {
  callback()
})

const tasks = {
  /**
   * ### Default gulp build task
   *
   * @task build
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'build': (callback) => {
    sequence(
      'less',
      'jsdoc',
      callback
    )
  },
  /**
   * #### Compile less files
   *
   * compile less files to htdocs/css
   *
   * @task less
   * @namespace tasks
   */
  'less': [['lesshint'], () => {
    return combiner.obj([
      gulp.src(config.gulp.build.less.src),
      less({
        plugins: [lessPluginGlob]
      }),
      autoprefixer('last 3 version', 'safari 5', 'ie 8', 'ie 9', 'ios 6', 'android 4'),
      gulp.dest(config.gulp.build.less.dest),
      log({ message: 'written: <%= file.path %>', title: 'Gulp less' })
    ])
      .on('error', () => { })
  }],
  /**
   * #### Compile js files
   *
   * compile js files to htdocs/js
   *
   * @task jsss
   * @namespace tasks
   */
  'js': () => {
    return gulp.src(config.gulp.build.js.src)
      .pipe(rename(function (path) {
        Object.keys(config.gulp.build.js.replace).forEach((key) => {
          path.dirname = path.dirname.replace(key, config.gulp.build.js.replace[key])
        })
      }))
      .pipe(gulp.dest(config.gulp.build.js.dest))
      .pipe(log({ message: 'written: <%= file.path %>', title: 'Gulp js' }))
  },
  /**
   * #### Compile jsdoc
   *
   * compile jsdoc
   *
   * @task jsdoc
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'jsdoc': [['jshint'], (callback) => {
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
    }
    gulp.src(config.gulp.build.jsdoc.src, { read: false })
      .pipe(jsdoc(jsdocConfig, callback))
  }]
}

loadTasks.importTasks(tasks)
