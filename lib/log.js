/**
 * ## Log output helper
 *
 * @module lib/log
 */
'use strict';

const chalk = require('chalk'),
  dateFormat = require('dateformat')
  ;

let filename = '';
let results = {};
let testCaseKey = '';
let testStepKey = '';

/**
 * print timestamp and message to console
 *
 * @param {string} msg - output message
 */
const info = (msg) => {
  console.log('[' + chalk.gray(dateFormat(new Date(), 'HH:MM:ss')) + '] ' + msg);
};

/**
 * print error message and log in results
 *
 * @param {string} msg - output message
 */
const error = (msg) => {
  console.log('[' + chalk.gray(dateFormat(new Date(), 'HH:MM:ss')) + '] ' + chalk.red(msg));
  results[testCaseKey][testStepKey].error.push(msg);
};

/**
 * save screenshot filename in results
 *
 * @param {string} msg - output message
 */
const screenshot = (filename) => {
  results[testCaseKey][testStepKey].screenshot = filename;
};

/**
 * set filename for results
 *
 * @param {string} msg - output message
 */
const setFilename = (file) => {
  filename = file;
  info('results filename: ' + filename);
};

/**
 * set testData for results
 *
 * @param {object} data - testData structure
 */
const setData = (data) => {
  results.testConfig = data;
};

/**
 * start new testCase
 *
 * @param {string} name - for test case
 */
const testCase = (name) => {
  testCaseKey = name;
  results[name] = {};
  info('Testcase: ' + name);
};

/**
 * start new testStep
 *
 * @param {string} name - for test step
 */
const testStep = (name, config) => {
  testStepKey = name;
  results[testCaseKey][testStepKey] = {
    config: config,
    error: []
  };
  info('Test-Step: ' + name);
};

module.exports = {
  filename: () => filename,
  results: () => results,
  info: info,
  error: error,
  screenshot: screenshot,
  setFilename: setFilename,
  setData: setData,
  testCase: testCase,
  testStep: testStep,
};
