/**
 * ## Require file with e2e test configuration or results
 *
 * @module lib/requireFile
 */

'use strict';

const fs = require('fs'),
  path = require('path');

/**
 * Require js file content
 *
 * @function requireFile
 * @param {String} filename - js file to require
 */
function requireFile (filename) {
  const filepath = path.join(__dirname, '../../../..', filename);
  if (fs.existsSync(filepath)) {
    if (require.cache[require.resolve(filepath)]) {
      delete require.cache[require.resolve(filepath)];
    }
    return require(filepath);
  } else {
    throw new Error('required file ' + filepath + ' not found');
  }
}

module.exports = {
  requireFile: requireFile
};