/**
 * Read configuration.yaml files
 *
 * @module lib/config
 */

'use strict';

const fs = require('fs'),
  glob = require('glob'),
  yaml = require('js-yaml'),
  path = require('path'),
  ipv4addresses = require('./ipv4addresses');

/**
 * Parsed configuration.xaml file
 */
const config = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, '..', 'configuration.yaml'), 'utf8')
);

/**
 * Parsed configuration.yaml files for all modules
 */
let modules = { };

if (config) {
  glob.sync(config.server.modules + '/*/configuration.yaml')
    .forEach((filename) => {
      const module = filename.replace(/^.+\/([^\/]+)\/configuration\.yaml/, '$1');
      modules[module] = yaml.safeLoad(
        fs.readFileSync(filename, 'utf8')
      );
    });
}

module.exports = {
  config: config,
  modules: modules,
  /**
   * Exports config.gulp as gulp
   */
  gulp: config.gulp,
  /**
   * Exports config.server as server
   */
  server: config.server,
  getData: getData
};

/**
 * Get the basic data for the response
 *
 * @param {String} req - request
 */
function getData(req) {
  const moduleName = req.baseUrl.replace(/^\//, '');
  return {
    environment: process.env.NODE_ENV,
    hostname: req.hostname,
    hostIP: ipv4addresses.get()[0],
    livereloadPort: process.env.LIVERELOAD_PORT,
    moduleName: moduleName,
    module: modules[moduleName],
    modules: modules,
    session: req.session,
    url: {
      url: req.url,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
      path: req.path
    },
    ...req.params
  };
}
