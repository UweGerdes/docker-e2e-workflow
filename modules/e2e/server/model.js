/**
 * Model for boilerplate
 *
 * @module modules/e2e/server/model
 */

'use strict';

const { globSync } = require('glob'),
  path = require('path'),
  config = require('../../../lib/config'),
  { requireFile } = require('./lib/requireFile');

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
  getConfigsSync: () => {
    let paths = config.modules.e2e.configs;
    let configs = {};
    for (const filepath of paths) {
      for (const filename of globSync(filepath)) {
        let config = { };
        let resultFile = path.join('.', 'results', filename.replace(/\.js$/, ''), 'results.json');
        console.log('filename', filename);
        try {
          config = requireFile(resultFile);
        } catch (error) {
          config = requireFile(filename);
        }
        if (config) {
          config.filename = filename;
          if (configs[config.name]) {
            throw new Error('duplicate test name: ' + config.name);
          }
          configs[config.name] = config;
        } else {
          console.log('config file not found', path.join('/home/node/app/', filename));
        }
      }
    }
    return configs;
  }
};
