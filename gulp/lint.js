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
   * Default gulp lint task
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
   * Lint js files
   *
   * apply eslint to js files
   *
   * @function eslint
   */
  'eslint': () => {
    const isFixed = (file) => {
      /* c8 ignore next 1 */
      return file.eslint != null && file.eslint.fixed;
    };
    return gulp.src(config.gulp.watch.eslint)
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
   * Lint json files
   *
   * apply jsonlint json files
   *
   * @function jsonlint
   */
  'jsonlint': () => {
    return gulp.src(config.gulp.watch.jsonlint)
      .pipe(jsonlint())
      .pipe(jsonlint.reporter());
  },
  /**
   * Lint locales json files
   *
   * apply jsonlint locales json files
   *
   * @function localesjsonlint
   */
  'localesjsonlint': () => {
    return gulp.src(config.gulp.watch.locales)
      .pipe(jsonlint())
      .pipe(jsonlint.reporter())
      .pipe(jsonlint.failOnError());
  },
  /**
   * Lint less files
   *
   * apply lesshint to less files
   *
   * @function lesshint
   */
  'lesshint': () => {
    return gulp.src(config.gulp.watch.less)
      .pipe(lesshint())
      .on('error', function () {})
      .pipe(lesshint.reporter())
      .pipe(lesshint.failOnError());
  },
  /**
   * Lint yaml files
   *
   * apply yamlValidate to yaml files
   *
   * @function yamllint
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
   * Lint pug files
   *
   * apply pug-linter to pug files
   *
   * @function puglint
   */
  'puglint': () => {
    return gulp.src(config.gulp.watch.puglint)
      .pipe(pugLinter({ reporter: 'default', failAfterError: true }));
  },
  /**
   * Lint ejs and livereload task
   *
   * @function lint
   * @param {function} callback - gulp callback to signal end of task
   */
  /* c8 ignore next 6 */
  'ejslint-livereload': [['ejslint'], (callback) => {
    sequence(
      'livereload-all',
      callback
    );
  }],
  /**
   * Lint ejs files
   *
   * - replace `<%=`, `<%-` tags with output = [expression];
   * - strip non ejs html and `<%` and `%>`
   * - keep lines for counting
   *
   * options are supplied here - TODO use .ejslintrc
   *
   * @function ejslint
   * @param {function} callback - gulp callback to signal end of task
   */
  'ejslint': (callback) => {
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

    Promise.all(config.gulp.watch['ejslint-livereload'].map(filePromises.getFilenames))
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
        }
        callback(error);
      });
  }
};

if (process.env.NODE_ENV === 'development') {
  loadTasks.importTasks(tasks);
/* c8 ignore next 6 */
} else {
  loadTasks.importTasks({
    eslint: () => { },
    ejslint: () => { }
  });
}
