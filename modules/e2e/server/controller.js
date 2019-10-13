/**
 * Controller for boilerplate
 *
 * @module modules/boilerplate/server/controller
 * @requires modules/boilerplate/server/model
 * @requires module:lib/config
 */

'use strict';

const fs = require('fs'),
  path = require('path'),
  config = require('../../../lib/config'),
  files = require('../../../lib/files-promises'),
  model = require('./model');

const viewBase = path.join(path.dirname(__dirname), 'views');

/**
 * Serve results files
 *
 * @param {object} app - express server
 */
const useExpress = async (app) => {
  app.get(/\/results\/.+/,
    (req, res) => {
      res.sendFile(path.join(__dirname, '..', '..', '..', decodeURIComponent(req.path)));
    });
};

/**
 * Render index page
 *
 * @param {object} req - request
 * @param {object} res - result
 */
const index = async (req, res) => {
  let data = {
    ...config.getData(req),
    model: model.getData(),
    configs: await getConfigs(),
    config: {
      name: 'Keine Config geladen',
      configfile: 'none'
    },
    results: { status: 'not executed' }
  };
  res.render(path.join(viewBase, 'index.pug'), data);
};

/**
 * Render config page
 *
 * @param {object} req - request
 * @param {object} res - result
 */
const configPage = async (req, res, next) => {
  if (req.path.match(/^\/config\/.+$/)) {
    try {
      const configuration = await files.requireFile(req.path);
      const resultsFilename = req.params[0] || path.join('config', 'default.js');
      const resultsPath = path.join('results', resultsFilename.replace(/\.js/, ''));
      const results = await files.requireFile(path.join(resultsPath, req.query.viewport, 'results.json'));
      let data = {
        ...config.getData(req),
        model: model.getData(),
        configs: await getConfigs(),
        configFile: req.path,
        config: configuration,
        queryViewport: req.query.viewport || '',
        queryCase: req.query.case || '',
        queryStep: req.query.step || '',
        results: results,
        resultsPath: resultsPath
      };
      res.render(path.join(viewBase, 'index.pug'), data);
    } catch (error) {
      req.error = { code: 404, name: 'File not found', error: error.message };
      next();
    }
  } else {
    console.log(req.path, 'not found');
    next();
  }
};

module.exports = {
  index: index,
  configPage: configPage,
  useExpress: useExpress
};

/**
 * get configuration files and labels
 */
async function getConfigs () {
  let paths = [];
  let configs = {};
  if (process.env.NODE_ENV === 'development') {
    paths = config.gulp.tests['test-e2e-workflow-default'];
  }
  paths = paths.concat(config.gulp.tests['test-e2e-workflow-modules']);
  for (const filepath of paths) {
    for (const filename of await files.getFilenames(filepath)) { // eslint-disable-line no-await-in-loop
      let config = { };
      let resultFile = path.join('.', 'results', filename.replace(/\.js$/, ''), 'results.json');
      if (fs.existsSync(resultFile)) {
        config = await files.requireFile(resultFile); // eslint-disable-line no-await-in-loop
      } else {
        config = await files.requireFile(filename); // eslint-disable-line no-await-in-loop
      }
      config.filename = filename;
      if (configs[config.name]) {
        throw new Error('duplicate test name');
      }
      configs[config.name] = config;
    }
  }
  return configs;
}
