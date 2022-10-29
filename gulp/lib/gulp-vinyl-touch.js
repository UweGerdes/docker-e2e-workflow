/**
 * Gulp plugin to set atime and mtime for vinyl file
 *
 * @module gulp-vinyl-touch
 */

'use strict';

const Transform = require('stream').Transform;

module.exports = () => {
  let transformStream = new Transform({ objectMode: true });
  /**
   * @param {Buffer|string} file
   * @param {string=} encoding - ignored if file contains a Buffer
   * @param {function(Error, object)} callback - Call this function (optionally with an
   *          error argument and data) when you are done processing the supplied chunk.
   */
  transformStream._transform = function(file, encoding, callback) {
    let error = null;
    if (file !== null && file.stat !== null) {
      file.stat.atime = file.stat.mtime = new Date();
    } else {
      error = new Error('not a vinyl file', file.isVinyl);
    }
    callback(error, file);
  };
  return transformStream;
};
