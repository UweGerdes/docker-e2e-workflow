/**
 * Gulp server task for e2e - no real function, just test
 *
 */

'use strict';

const log = require('../../../lib/log');

const tasks = {
  /**
   * test task
   *
   * @function test-e2e-workflow-modules
   * @param {function} callback - gulp callback to signal end of task
   */
  /* c8 ignore next 4 */
  'test-e2e-workflow-modules': (callback) => {
    log.info('test-e2e-workflow-modules called ');
    callback();
  }
};

module.exports = tasks;
