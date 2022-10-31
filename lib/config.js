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
const config = yaml.load(
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
      modules[module] = yaml.load(
        fs.readFileSync(filename, 'utf8')
      );
    });
}

let gulp = mergeDeep({ }, config.gulp);
Object.keys(modules).forEach((module) => {
  if (modules[module].gulp) {
    gulp = mergeDeep(modules[module].gulp, gulp);
  }
});

module.exports = {
  config: config,
  modules: modules,
  /**
   * Exports config.gulp as gulp
   */
  gulp: gulp,
  /**
   * Exports config.server as server
   */
  server: config.server,
  getData: getData
};

/**
* Performs a deep merge of objects and returns new object. Does not modify
* objects (immutable) and merges arrays via concatenation.
* https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
*
* @param {...object} objects - Objects to merge
* @returns {object} New object with merged key/values
*/
function mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = [].concat(...pVal, ...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

/**
 * Get the basic data for the response
 *
 * @param {String} req - request
 */
function getData(req) {
  const modulePath = req.baseUrl.replace(/^\/(.*)\/?$/, '$1');
  return {
    environment: process.env.NODE_ENV,
    hostname: req.hostname,
    hostIP: ipv4addresses.get()[0],
    livereloadPort: process.env.LIVERELOAD_PORT,
    modulePath: modulePath,
    module: modules[modulePath],
    modules: modules,
    session: req.session,
    url: {
      url: req.url,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
      path: req.path
    },
    href: (path) => {
      return '/' + modulePath + path;
    },
    ...req.params
  };
}
