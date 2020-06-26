/**
 * Promise functions for file access
 *
 * @module lib/files-promises
 */

'use strict';

const fs = require('fs'),
  glob = require('glob'),
  path = require('path');

// execute only one test file if one has changed in recentTime, otherwise all
const recentTime = 10;

/**
 * Get list of files for glob pattern
 *
 * @function getFilenames
 * @param {function} path - patterns for paths
 */
const getFilenames = (path) => {
  return new Promise((resolve, reject) => {
    glob(path, (error, files) => {
      /* c8 ignore next 2 */
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
};

/**
 * Get newest file from glob list - synchronous
 *
 * @function getRecentFiles
 * @param {array} files - list with glob paths
 */
function getRecentFiles(files) {
  let newest = null;
  let bestTime = 0;
  for (let i = 0; i < files.length; i++) {
    const fileTime = fs.statSync(files[i]).mtime.getTime();
    if (fileTime > bestTime) {
      newest = files[i];
      bestTime = fileTime;
    }
  }
  const now = new Date();
  /* c8 ignore next 4 */
  if (now.getTime() - bestTime < recentTime * 1000) {
    return new Promise((resolve) => {
      resolve([newest]);
    });
  } else {
    return new Promise((resolve) => {
      resolve(files);
    });
  }
}

/**
 * Get the file content
 *
 * @function getFileContent
 * @param {function} filename - filepath/filename to open
 */
const getFileContent = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (error, data) => {
      /* c8 ignore next 2 */
      if (error) {
        reject(error);
      } else {
        resolve({ filename: filename, content: data.toString() });
      }
    });
  });
};

/**
 * Require js file content
 *
 * @function requireFile
 * @param {String} filename - js file to require
 */
function requireFile (filename) {
  const filepath = path.join(__dirname, '..', filename);
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
  getFilenames: getFilenames,
  getRecentFiles: getRecentFiles,
  getFileContent: getFileContent,
  requireFile: requireFile
};
