/**
 * ## HTTP-Server for e2e-workflow results
 *
 * @module server
 */
'use strict';

const bodyParser = require('body-parser'),
  chalk = require('chalk'),
  dateFormat = require('dateformat'),
  express = require('express'),
  glob = require('glob'),
  morgan = require('morgan'),
  path = require('path'),
  config = require('./lib/config'),
  ipv4addresses = require('./lib/ipv4addresses'),
  log = require('./lib/log'),
  app = express()
  ;

const httpPort = config.server.httpPort,
  livereloadPort = config.server.livereloadPort,
  docRoot = config.server.docroot,
  modulesRoot = config.server.modules,
  verbose = config.server.verbose
  ;

/**
 * Weberver logging
 *
 * using log format starting with [time]
 */
if (verbose) {
  morgan.token('time', () => { // jscs:ignore jsDoc
    return dateFormat(new Date(), 'HH:MM:ss');
  });
  app.use(morgan('[' + chalk.gray(':time') + '] ' +
    ':method :status :url :res[content-length] Bytes - :response-time ms'));
}

// base directory for views
app.set('views', __dirname);

// render ejs files
app.set('view engine', 'ejs');

// work on post requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(docRoot));

/**
 * Route for root dir
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(docRoot, 'index.html'));
});

/**
 * Route for app main page
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get('/app', (req, res) => {
  res.render(viewPath('app.pug'), {
    hostname: req.hostname,
    livereloadPort: livereloadPort,
    configs: getConfigs(),
    config: {
      name: 'Keine Config geladen',
      configfile: 'none',
    },
    results: { status: 'not executed' }
  });
});

/**
 * Route for app config page
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get(/^\/app\/(.+)$/, (req, res) => {
  res.render(viewPath('app.pug'), {
    hostname: req.hostname,
    livereloadPort: livereloadPort,
    configs: getConfigs(),
    configFile: req.params[0],
    config: getConfig(req.params[0]),
    queryStep: req.query.step,
    results: { status: 'not executed' }
  });
});

/**
 * Route for results
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get(/^(\/results\/.+)$/, (req, res) => {
  res.sendFile(path.join(__dirname, req.params[0]));
});

/**
 * Route for everything else
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get('*', (req, res) => {
  res.status(404).render(viewPath('404.ejs'), {
    hostname: req.hostname,
    livereloadPort: livereloadPort,
    httpPort: httpPort
  });
});

// Fire it up!
log.info('server listening on ' +
  chalk.greenBright('http://' + ipv4addresses.get()[0] + ':' + httpPort));

app.listen(httpPort);

/**
 * Handle server errors
 *
 * @param {Object} err - error
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.use((err, req, res) => {
  console.error('SERVER ERROR:', err);
  if (res) {
    res.status(500)
      .render(viewPath('500.ejs'), {
        error: err,
        hostname: req.hostname,
        livereloadPort: livereloadPort,
        httpPort: httpPort
      }
    );
  }
});

/**
 * Get the path for file to render
 *
 * @private
 * @param {String} page - page type
 * @param {String} type - file type (ejs, jade, pug, html)
 */
function viewPath(page = '404.ejs') {
  return modulesRoot + '/views/' + page;
}

/**
 * get configuration files and labels
 */
function getConfigs() {
  let configs = {};
  Object.entries(config.gulp.tests).forEach(
    ([label, path]) => {
      console.log(label, glob.sync(path));
      configs[label] = glob.sync(path);
    }
  );
  return configs;
}

/**
 * get configuration file content
 *
 * @private
 * @param {String} filename - config filename
 */
function getConfig(filename) {
  return require('./' + filename);
}
