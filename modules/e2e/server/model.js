/**
 * Model for boilerplate
 *
 * @module modules/e2e/server/model
 */

'use strict';

let data = { modelData: 'boilerplate data' };

module.exports = {
  /**
   * Get data
   *
   * @returns {object} model data
   */
  getData: () => {
    return data;
  }
};
