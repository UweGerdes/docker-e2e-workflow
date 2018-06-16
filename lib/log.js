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
 * set filename for results
 *
 * @param {string} msg - output message
 */
const setFilename = (file) => {
  filename = file;
  info('config filename: ' + filename);
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
const testStep = (name) => {
  testStepKey = name;
  results.testCases[testCaseKey][name] = {};
  info('Test-Step: ' + name);
};

module.exports = {
  filename: () => filename,
  results: () => results,
  info: info,
  setFilename: setFilename,
  setData: setData,
  testCase: testCase,
  testStep: testStep,
};
