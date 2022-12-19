/**
 * Model for boilerplate
 *
 * @module modules/e2e/server/model
 */

'use strict';

const path = require('path'),
  config = require('../../../lib/config'),
  files = require('../../../lib/files-promises');

let data = { modelData: 'boilerplate data' };

module.exports = {
  /**
   * Get data
   *
   * @returns {object} model data
   */
  getData: () => {
    return data;
  },

  /**
   * get configuration files and labels
   *
   * @function getConfigs
   * @returns {Object} configuration data
   */
  getConfigs: async () => {
    let paths = config.modules.e2e.configs;
    let configs = {};
    for (const filepath of paths) {
      for (const filename of await files.getFilenames(filepath)) { // eslint-disable-line no-await-in-loop
        let config = { };
        let resultFile = path.join('.', 'results', filename.replace(/\.js$/, ''), 'results.json');
        try {
          config = files.requireFile(resultFile); // eslint-disable-line no-await-in-loop
        } catch (error) {
          config = files.requireFile(filename); // eslint-disable-line no-await-in-loop
        }
        config.filename = filename;
        if (configs[config.name]) {
          throw new Error('duplicate test name: ' + config.name);
        }
        configs[config.name] = config;
      }
    }
    return configs;
  }
};
