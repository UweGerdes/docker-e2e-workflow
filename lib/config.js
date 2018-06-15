/**
 * @module lib:config
 * @private
 */
'use strict';

const fs = require('fs'),
  yaml = require('js-yaml'),
  path = require('path')
  ;

/**
 * Parse config for all modules
 *
 * @private
 */
const config = yaml.safeLoad(
    fs.readFileSync(path.join(__dirname, '..', 'configuration.yaml'), 'utf8')
   );

module.exports = {

  /**
   * Exports config
   */
  config: config,

  /**
   * Exports gulp
   */
  gulp: config.gulp,

  /**
   * Exports server
   */
  server: config.server,

  /**
   * Returns path for watch task
   *
   * @param {string} task - name
   * @returns {array} - array with config
   */
  gulpWatch: (task) => {
    if (!config.gulp.watch[task]) {
      throw ('watch path for ' + task + ' not defined in configuration.yaml');
    }
    return config.gulp.watch[task];
  },

  /**
   * Returns config for build task
   *
   * @param {string} task - name
   * @returns {object} - src and dest config
   */
  gulpBuild: (task) => {
    if (!config.gulp.build[task]) {
      throw ('build path for ' + task + ' not defined in configuration.yaml');
    }
    return config.gulp.build[task];
  }
};
