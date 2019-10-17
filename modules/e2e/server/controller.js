/**
 * Controller for boilerplate
 *
 * @module modules/boilerplate/server/controller
 * @requires modules/boilerplate/server/model
 * @requires module:lib/config
 */

'use strict';

const exec = require('child_process').exec,
  fs = require('fs'),
  path = require('path'),
  ansiColors = require('../../../lib/ansiColors'),
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
      let results;
      if (req.query.viewport) {
        results = await files.requireFile(path.join(resultsPath, req.query.viewport, 'results.json'));
      }
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
      req.error = { code: 500, name: 'File read error: ' + req.path, error: error.message };
      next();
    }
  } else {
    req.error = { code: 500, name: 'Path error', error: 'Path must be /e2e/config/[path]/[testfile].js but is ' + req.path };
    next();
  }
};

/**
 * Run test config
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
function runConfig (req, res) {
  res.status(200);
  if (req.query.config) {
    console.log('run node ' + __dirname + '/lib/index.js --cfg=' + req.query.config);
    const loader = exec('export FORCE_COLOR=1; node ' + __dirname + '/lib/index.js --cfg=' + req.query.config);
    loader.stdout.on('data', (data) => {
      console.log(data.toString().trim());
      res.write(ansiColors.toHTML(data.toString().trim().replace(/\n/, '<br />')) + '<br />');
      res.flush();
    });
    loader.stderr.on('data', (data) => {
      console.log('stderr: ' + data.toString().trim());
      res.write(ansiColors.toHTML('stderr: ' + data.toString().trim().replace(/\n/, '<br />')) + '<br />');
      res.flush();
    });
    loader.on('error', (err) => {
      console.log('error: ' + err.toString().trim());
      res.write(ansiColors.toHTML('err: ' + err.toString().trim().replace(/\n/, '<br />')) + '<br />');
    });
    loader.on('close', (code) => {
      if (code > 0) {
        console.log('e2e-workflow exit-code: ' + code);
        res.write('e2e-workflow exit-code: ' + code);
      }
      res.end();
    });
  } else {
    res.write('<h1>Error: parameter config not set<br />');
    res.end();
  }
}

module.exports = {
  index: index,
  configPage: configPage,
  runConfig: runConfig,
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
