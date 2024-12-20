/**
 * Controller for boilerplate
 *
 * @module modules/e2e/server/controller
 * @requires modules/boilerplate/server/model
 * @requires module:lib/config
 */

'use strict';

const exec = require('child_process').exec,
  path = require('path'),
  ansiColors = require('./lib/ansiColors'),
  config = require('../../../lib/config'),
  { requireFile } = require('./lib/requireFile'),
  model = require('./model');

const viewBase = path.join(path.dirname(__dirname), 'views');

/**
 * Serve results files
 *
 * @function useExpress
 * @param {object} app - express server
 */
const useExpress = async (app) => {
  app.get(
    /\/results\/.+/,
    (req, res) => {
      res.sendFile(path.join(__dirname, '..', '..', '..', decodeURIComponent(req.path)));
    }
  );
};

/**
 * Render index page
 *
 * @function index
 * @param {object} req - request
 * @param {object} res - result
 * @param {object} next - for error handling
 */
const index = (req, res, next) => {
  if (req.query.config) {
    if (req.query.config.match(/^\/config\/.+$/)) {
      try {
        const configuration = requireFile(req.query.config);
        const resultsFilename = req.query.config || path.join('config', 'default.js');
        const resultsPath = path.join('results', resultsFilename.replace(/\.js$/, ''));
        let results;
        try {
          results = requireFile(path.join(resultsPath, req.query.viewport, 'results.json'));
        } catch (error) {
          // console.log('path not found', resultsPath, error.message);
        }
        let data = {
          ...config.getData(req),
          model: model.getData(),
          configs: model.getConfigsSync(),
          configFile: req.query.config,
          config: configuration,
          queryViewport: req.query.viewport || '',
          queryCase: req.query.case || '',
          queryStep: req.query.step || '',
          resultsPath: resultsPath,
          results: results
        };
        res.render(path.join(viewBase, 'index.pug'), data);
      } catch (error) {
        req.error = { code: 500, name: 'File read error: ' + req.query.config, error: error };
        next();
      }
    } else {
      req.error = { code: 500, name: 'Path error', error: 'config must be /config/[path]/[file].js but is ' + req.query.config };
      next();
    }
  } else {
    let data = {
      ...config.getData(req),
      model: model.getData(),
      configs: model.getConfigsSync(),
      results: { status: 'not executed' }
    };
    res.render(path.join(viewBase, 'index.pug'), data);
  }
};

/**
 * Run test config
 *
 * @function runConfig
 * @param {Object} req - request
 * @param {Object} res - response
 */
function runConfig (req, res) {
  res.status(200);
  if (req.query.config) {
    console.log('run node ' + process.env.APP_HOME + '/index.js --cfg=' + req.query.config);
    res.write('<p>');
    const loader = exec('export FORCE_COLOR=1; node ' + process.env.APP_HOME + '/index.js --cfg=' + req.query.config);
    loader.stdout.on('data', (data) => {
      console.log(data.toString().trim());
      res.write(ansiColors.toHTML(data.toString().trim().replace(/\n/, '<br />')) + '<br />');
    });
    loader.stderr.on('data', (data) => {
      console.log('stderr: ' + data.toString().trim());
      res.write(ansiColors.toHTML('stderr: ' + data.toString().trim().replace(/\n/, '<br />')) + '<br />');
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
      res.write('</p>');
      res.end();
    });
  } else {
    res.write('<h1 class="error">Error: parameter config not set</h1>');
    res.end();
  }
}

module.exports = {
  index: index,
  runConfig: runConfig,
  useExpress: useExpress
};
