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
let results = {
  steps: 0,
  errors: 0,
  testCases: {}
};
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
 * print summary message
 */
const summary = () => {
  if (results.errors === 0) {
    info(chalk.green.bold.inverse('Executed ' + results.steps + ' steps, no errors'));
  } else {
    info(chalk.red.bold.inverse('Executed ' + results.steps + ' steps, ' +
      results.errors + ' error(s)'));
  }
};

/**
 * print error message and log in results
 *
 * @param {string} msg - output message
 */
const error = (msg) => {
  info(chalk.red(msg));
  results.testCases[testCaseKey][testStepKey].errors.push(msg);
  results.errors++;
};

/**
 * save screenshot filename in results
 *
 * @param {string} msg - output message
 */
const screenshot = (filename) => {
  results.testCases[testCaseKey][testStepKey].screenshot = filename;
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
  results.testCases[name] = {};
  info('Testcase: ' + name);
};

/**
 * start new testStep
 *
 * @param {string} name - for test step
 */
const testStep = (name, config) => {
  testStepKey = name;
  results.testCases[testCaseKey][testStepKey] = {
    config: config,
    errors: []
  };
  results.steps++;
  info('Test: ' + testCaseKey + ' ' + name);
};

module.exports = {
  filename: () => filename,
  results: () => results,
  info: info,
  error: error,
  summary: summary,
  screenshot: screenshot,
  setFilename: setFilename,
  setData: setData,
  testCase: testCase,
  testStep: testStep,
};
