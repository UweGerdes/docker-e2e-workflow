/**
 * ## HTTP-Server for e2e-workflow results
 *
 * @module server
 */
'use strict'

const bodyParser = require('body-parser')
const chalk = require('chalk')
const dateFormat = require('dateformat')
const express = require('express')
const fs = require('fs')
const glob = require('glob')
const morgan = require('morgan')
const path = require('path')
const config = require('./lib/config')
const ansiColors = require('./lib/ansiColors')
const ipv4addresses = require('./lib/ipv4addresses')
const app = express()

const httpPort = config.server.httpPort
const docRoot = config.server.docroot
const modulesRoot = config.server.modules
const verbose = config.server.verbose

/**
 * Weberver logging
 *
 * using log format starting with [time]
 */
if (verbose) {
  morgan.token('time', () => { // jscs:ignore jsDoc
    return dateFormat(new Date(), 'HH:MM:ss')
  })
  app.use(morgan('[' + chalk.gray(':time') + '] ' +
    ':method :status :url :res[content-length] Bytes - :response-time ms'))
}

// base directory for views
app.set('views', __dirname)

// render ejs files
app.set('view engine', 'ejs')

// work on post requests
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Serve static files
app.use(express.static(docRoot))

/**
 * Route for root dir
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(docRoot, 'index.html'))
})

/**
 * Route for app main page
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get('/app', (req, res) => {
  res.render(viewPath('app.pug'), {
    hostname: req.hostname,
    livereloadPort: getLivereloadPort(req),
    configs: getConfigs(),
    config: {
      name: 'Keine Config geladen',
      configfile: 'none'
    },
    results: { status: 'not executed' }
  })
})

/**
 * Route for app config page
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get(/^\/app\/(.+)$/, (req, res) => {
  const config = requireFile(req.params[0])
  let results
  const resultsFilename = req.params[0] || path.join('config', 'default.js')
  const resultsPath = path.join('results', resultsFilename.replace(/\.js/, ''))
  try {
    console.log(path.join('results', resultsFilename.replace(/\.js/, ''), 'results.json'))
    results = requireFile(path.join(resultsPath, 'results.json'))
  } catch (e) { }
  res.render(viewPath('app.pug'), {
    hostname: req.hostname,
    livereloadPort: getLivereloadPort(req),
    configs: getConfigs(),
    configFile: req.params[0],
    config: config,
    queryCase: req.query.case || '',
    queryStep: req.query.step || '',
    results: results,
    resultsPath: resultsPath
  })
})

/**
 * Route for results
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get(/^(\/results\/.+)$/, (req, res) => {
  res.sendFile(path.join(__dirname, req.params[0]))
})

/**
 * Run test
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get(/^\/run\/(.+)$/, (req, res) => {
  runConfig(req.params[0])
})

/**
 * Route for everything else
 *
 * @param {Object} req - request
 * @param {Object} res - response
 */
app.get('*', (req, res) => {
  res.status(404).render(viewPath('404.ejs'), {
    hostname: req.hostname,
    livereloadPort: getLivereloadPort(req)
  })
})

// Fire it up!
console.log('[' + chalk.greenBright(dateFormat(new Date(), 'HH:MM:ss')) + '] ' + 'server listening on ' +
  chalk.greenBright('http://' + ipv4addresses.get()[0] + ':' + httpPort))

app.listen(httpPort)

/**
 * Handle server errors
 *
 * @param {Object} err - error
 * @param {Object} req - request
 * @param {Object} res - response
 * @param {Object} next - needed for complete signature
 */
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err)
  if (err) {
    res.status(500)
      .render(viewPath('500.ejs'), {
        error: err,
        hostname: req.hostname,
        livereloadPort: getLivereloadPort(req)
      })
  } else {
    next()
  }
})

/**
 * Get port number for livereload
 *
 * @private
 * @param {Object} req - request
 */
function getLivereloadPort (req) {
  let livereloadPort = config.server.livereloadPort
  const host = req.get('Host')
  if (host.indexOf(':') > 0) {
    livereloadPort = parseInt(host.split(':')[1]) + 1
  }
  return livereloadPort
}

/**
 * Get the path for file to render
 *
 * @private
 * @param {String} page - page type
 * @param {String} type - file type (ejs, jade, pug, html)
 */
function viewPath (page = '404.ejs') {
  return modulesRoot + '/views/' + page
}

/**
 * get configuration files and labels
 */
function getConfigs () {
  let configs = {}
  Object.entries(config.gulp.tests['test-e2e-workflow-modules']).forEach(
    ([label, path]) => {
      configs[label] = glob.sync(path)
    }
  )
  return configs
}

/**
 * Execute the tests
 *
 * @private
 * @param {String} configFile - filename
 */
function runConfig (configFile) {
  console.log(ansiColors.toHTML(configFile))
}

/**
 * get js file content
 *
 * @private
 * @param {String} filename - config filename
 */
function requireFile (filename) {
  delete require.cache[require.resolve('./' + filename)]
  if (fs.existsSync('./' + filename)) {
    return require('./' + filename)
  } else {
    console.log('[' + chalk.gray(dateFormat(new Date(), 'HH:MM:ss')) + '] ' +
      chalk.red('server require ./' + filename + ' not found'))
  }
}
