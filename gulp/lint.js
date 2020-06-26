/**
 * Gulp tasks for linting sources
 *
 * @module gulp/lint
 * @requires module:lib/config
 * @requires module:lib/files-promises
 * @requires module:gulp/lib/load-tasks
 * @requires module:gulp/lib/notify
 */

'use strict';

const gulp = require('gulp'),
  changedInPlace = require('gulp-changed-in-place'),
  eslint = require('gulp-eslint'),
  gulpIf = require('gulp-if'),
  jsonlint = require('gulp-jsonlint'),
  lesshint = require('gulp-lesshint'),
  pugLinter = require('gulp-pug-linter'),
  sequence = require('gulp-sequence'),
  yamlValidate = require('gulp-yaml-validate'),
  path = require('path'),
  PluginError = require('plugin-error'),
  check = require('syntax-error'),
  config = require('../lib/config'),
  filePromises = require('../lib/files-promises'),
  loadTasks = require('./lib/load-tasks'),
  notify = require('./lib/notify');

const tasks = {
  /**
   * default gulp lint task, start all tasks for current `NODE_ENV`
   *
   * @function lint
   * @param {function} callback - gulp callback to signal end of task
   */
  'lint': (callback) => {
    sequence(
      ...config.gulp.start[process.env.NODE_ENV].lint,
      callback
    );
  },
  /**
   * Apply eslint to `config.gulp.lint.eslint.files` files
   *
   * @function eslint
   * @return {Gulp-Pipe} piped steps for eslint, report, fixture, logging and fail on error
   */
  'eslint': () => {
    const isFixed = (file) => {
      /* c8 ignore next 1 */
      return file.eslint != null && file.eslint.fixed;
    };
    return gulp.src(config.gulp.lint.eslint.files)
      .pipe(changedInPlace({ howToDetermineDifference: 'modification-time' }))
      .pipe(notify({ message: 'linting: <%= file.path %>', title: 'Gulp eslint' }))
      .pipe(eslint({ configFile: path.join(__dirname, '..', '.eslintrc.js'), fix: true }))
      .pipe(eslint.format())
      .pipe(eslint.results(results => {
        /* c8 ignore next 7 */
        if (results.length && (results.warningCount > 0 || results.errorCount > 0)) {
          console.log(
            `Total Results: ${results.length},  ` +
              `Warnings: ${results.warningCount}, ` +
              `Errors: ${results.errorCount}`
          );
        }
      }))
      /* c8 ignore next 1 */
      .pipe(gulpIf(isFixed, gulp.dest(config.gulp.lint.eslint.fixtureDir || './fixture')))
      .pipe(gulpIf(isFixed, notify({
        message: 'fixture: <%= file.path %>',
        title: 'Gulp eslint --fix'
      })))
      .pipe(eslint.failAfterError());
  },
  /**
   * Apply jsonlint to `config.gulp.watch.jsonlint` files
   *
   * @function jsonlint
   * @return {Gulp-Pipe} piped steps for jsonlint
   */
  'jsonlint': () => {
    return gulp.src(config.gulp.watch.jsonlint)
      .pipe(jsonlint())
      .pipe(jsonlint.reporter());
  },
  /**
   * Apply jsonlint to `config.gulp.watch.locales` files
   *
   * @function localesjsonlint
   * @return {Gulp-Pipe} piped steps for locales json files, report and fail on error
   */
  'localesjsonlint': () => {
    return gulp.src(config.gulp.watch.locales)
      .pipe(jsonlint())
      .pipe(jsonlint.reporter())
      .pipe(jsonlint.failOnError());
  },
  /**
   * Apply lesshint to `config.gulp.watch.less` files
   *
   * @function lesshint
   * @return {Gulp-Pipe} piped steps for lesslint, report and fail on error
   */
  'lesshint': () => {
    return gulp.src(config.gulp.watch.less)
      .pipe(lesshint())
      .on('error', function () {})
      .pipe(lesshint.reporter())
      .pipe(lesshint.failOnError());
  },
  /**
   * Apply yamlValidate to `config.gulp.watch.yamllint` files
   *
   * @function yamllint
   * @return {Gulp-Pipe} piped steps for yamllint, log on error
   */
  'yamllint': () => {
    return gulp.src(config.gulp.watch.yamllint)
      .pipe(yamlValidate({ space: 2 }))
      .on('error', (msg) => {
        /* c8 ignore next 1 */
        console.log(msg);
      });
  },
  /**
   * Apply pug-linter to `config.gulp.watch.puglint` files
   *
   * @function puglint
   * @return {Gulp-Pipe} piped steps for puglint, report and fail on error
   */
  'puglint': () => {
    return gulp.src(config.gulp.watch.puglint)
      .pipe(pugLinter({ reporter: 'default', failAfterError: true }));
  },
  /**
   * Run `ejslint` and `livereload-all` task
   *
   * @function ejslint
   * @param {function} callback - gulp callback to signal end of task
   */
  /* c8 ignore next 6 */
  'ejslint': (callback) => {
    sequence(
      'ejslint-exec',
      'livereload-all',
      callback
    );
  },
  /**
   * Lint `config.gulp.watch.ejslint` files
   *
   * - replace `<%=`, `<%-` tags with output = [expression];
   * - strip non ejs html and `<%` and `%>`
   * - keep lines for counting
   *
   * @function ejslint-exec
   * @param {function} callback - gulp callback to signal end of task
   */
  'ejslint-exec': async (callback) => {
    /**
     * Replace expression output tags
     *
     * @function ejslint:replaceOutputTags
     * @param {function} file - file object with contents
     */
    const replaceOutputTags = (file) => {
      return new Promise((resolve) => {
        file.noOutput = '<% var output, output_raw; %>' + file.content
          .replace(/<%= *(.+?) *%>/g, '<% output = $1; %>')
          .replace(/<%- *(.+?) *%>/g, '<% output_raw = $1; %>');
        resolve(file);
      });
    };

    /**
     * Replace html outside of ejs tags with returns
     *
     * @function ejslint:replaceEjsTags
     * @param {function} file - file object with contents
     */
    const replaceEjsTags = (file) => {
      return new Promise((resolve) => {
        let parts = file.noOutput.split(/<%/);
        let output = [];
        parts.forEach((part) => {
          let snips = part.split(/%>/);
          output.push(snips[0]);
          output.push(snips.join('%>').replace(/[^\n]/g, ''));
        });
        file.jsCode = output.join('');
        resolve(file);
      });
    };

    /**
     * Check the remaining content
     *
     * @function ejslint:fileCheck
     * @param {function} file - file object with contents
     */
    const fileCheck = (file) => {
      return new Promise((resolve) => {
        const err = check(file.jsCode, path.relative(process.cwd(), file.filename));
        /* c8 ignore next 3 */
        if (err) {
          resolve(err);
        }
        resolve();
      });
    };

    Promise.all(config.gulp.watch.ejslint.map(filePromises.getFilenames))
      .then((filenames) => [].concat(...filenames))
      .then((filenames) => {
        return Promise.all(
          filenames.map(filePromises.getFileContent)
        );
      })
      .then((files) => {
        return Promise.all(
          files.map(replaceOutputTags)
        );
      })
      .then((files) => {
        return Promise.all(
          files.map(replaceEjsTags)
        );
      })
      .then((files) => {
        return Promise.all(
          files.map(fileCheck)
        );
      })
      .then((errorList) => {
        let error;
        /* c8 ignore next 3 */
        if (errorList.join('').length > 0) {
          error = new PluginError('ejslint', errorList.join(''));
          callback(error);
        }
      });
  }
};

if (process.env.NODE_ENV === 'development') {
  loadTasks.importTasks(tasks);
/* c8 ignore next 6 */
} else {
  const envTasks = {
    eslint: () => { },
    ejslint: () => { }
  };
  config.gulp.start[process.env.NODE_ENV].lint.forEach(
    (key) => {
      envTasks[key] = tasks[key];
    }
  );
  loadTasks.importTasks(envTasks);
}
