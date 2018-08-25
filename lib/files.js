/**
 * ## files promises
 *
 * @module lib/files
 */
'use strict'

const fs = require('fs')
const glob = require('glob')

// get one file if it has changed in recentTime, otherwise all
const recentTime = 60 // * 60

/**
 * get list of files for glob pattern
 *
 * @private
 * @param {function} paths - patterns for paths
 */
const getFilenames = (path) => {
  return new Promise((resolve, reject) => {
    glob(path, (error, filenames) => {
      if (error) {
        reject(error)
      } else {
        resolve(filenames)
      }
    })
  })
}

/**
 * get newest file or list of all files a from glob list
 *
 * @param {array} files - list with glob paths
 */
function getRecentFiles (files) {
  let newest = null
  let bestTime = 0
  for (let i = 0; i < files.length; i++) {
    const fileTime = fs.statSync(files[i]).mtime.getTime()
    if (fileTime > bestTime) {
      newest = files[i]
      bestTime = fileTime
    }
  }
  const now = new Date()
  if (now.getTime() - bestTime < recentTime * 1000) {
    return new Promise((resolve) => {
      resolve([newest])
    })
  } else {
    return new Promise((resolve) => {
      resolve(files)
    })
  }
}

/**
 * get js file content
 *
 * @private
 * @param {Promise} filename - file content
 */
function requireFile (filename) {
  delete require.cache[require.resolve('./' + filename)]
  return new Promise((resolve, reject) => {
    if (fs.existsSync('./' + filename)) {
      resolve(require('./' + filename))
    } else {
      reject(new Error('requireFile: ./' + filename + ' not found'))
    }
  })
}

module.exports = {
  getFilenames: getFilenames,
  getRecentFiles: getRecentFiles,
  requireFile: requireFile
}
