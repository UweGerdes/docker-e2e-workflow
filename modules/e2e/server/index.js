/**
 * Routes for e2e-2workflow
 *
 * @module modules/e2e/server/index
 * @requires module:modules/e2e/server/controller
 */

'use strict';

const router = require('express').Router(); // eslint-disable-line new-cap

const controller = require('./controller');

/**
 * GET / route
 *
 * @name get_default_route
 */
router.get('/', controller.index);

/**
 * GET /configPage/ route
 *
 * @name get_configPage_route
 */
router.get(/\/config\/.+/, controller.configPage);

/**
 * GET /runConfig/ route
 *
 * @name get_runConfig_route
 */
router.get('/run', controller.runConfig);

module.exports = {
  router: router,
  useExpress: controller.useExpress
};
