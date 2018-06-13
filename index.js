/*
 * Testing http workflows
 *
 * execute: casperjs [--engine=slimerjs] test index.js --cfg=config/default.js
 *
 * The config file contains test cases and exports a test suite stucture.
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

'use strict';

const { Builder, By, Key, until } = require('selenium-webdriver');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

let viewportSize = { width: 1024, height: 768 };
let driver = new webdriver.Builder()
  .forBrowser('firefox')
  .usingServer('http://vcards-hub:4444/wd/hub')
  .setChromeOptions(
    new chrome.Options()
      .headless()
      .windowSize(viewportSize)
  )
  .setFirefoxOptions(
    new firefox.Options()
      .headless()
      .windowSize(viewportSize)
  )
  .build();

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  fs = require('fs'),
  makeDir = require('make-dir'),
  argv = require('minimist')(process.argv.slice(2)),
  path = require('path');

chai.use(chaiAsPromised);

let testData = null;
let testsSuccessful = 0;
let testsExecuted = 0;
let errorCount = 0;

if (argv.cfg) {
  const filename = argv.cfg;
  console.log('path', filename);
  if (fs.existsSync(path.join(__dirname, filename))) {
    console.log('Executing: "' + path.join(__dirname, filename) + '"');
    testData = require(path.join(__dirname, filename));
  } else {
    console.log('ERROR: file not found: "' + path.join(__dirname, filename) + '"');
  }
} else {
  console.log('Executing default: "' + path.join(__dirname, 'config', 'default.js') + '"');
  testData = require(path.join(__dirname, 'config', 'default.js'));
}
console.log('testData', testData);

if (testData) {
  makeDir(testData.dumpDir);

  if (testData.viewportSize) {
    viewportSize = testData.viewportSize;
  }

  // TODO: 404, 500, console.log, error

  // TODO: let browserAlerts = []; collect alerts

  console.log('Test: ' + testData.name);

  testData.testCases.forEach(function (testCase) {
    console.log('Test: ' + testData.name + ', Testcase: ' + testCase.name +
      ', URI: ' + testCase.uri);

    let promise = driver.get('http://vcards-dev:8080/vcards/');
    promise = promise.then(() => driver.getTitle());
    promise = promise.then((title) => {
        console.log('title', title);
        return driver.findElement(By.id('headline')).getText();
      });
    promise = promise.then(function (headline) {
        console.log('headline', headline);
        return driver.findElement(By.id('headline')).takeScreenshot(true);
      });
    promise = promise.then(function (screenshot) {
        console.log('screenshot.length', screenshot.length);
      });
    promise.then(
        () => driver.quit(),
        e => driver.quit().then(() => { throw e; })
      );

    /*
    let promise = driver.get(testCase.uri);

    if (testCase.title) {
      promise.then(_ => driver.getTitle())
      .then((title) => {
        return assert.eventually.equal(title.getText(), 'Webserver - vcards');
      })
      .then((screenshot) => {
        return driver.findElement(By.className('headline')).takeScreenshot(true);
      })
      .then((screenshot) => {
          console.log('screenshot.length', screenshot.length);
        })
      .then(
        _ => driver.quit(),
        e => driver.quit().then(() => { throw e; })
      );
    }
    */
  });
  /*
  casper.test.begin('Test: ' + testData.name, function suite(test) {
    casper.start();


      casper.thenOpen(testCase.uri, function () {
        this.echo('Test: ' + testData.name + ', Testcase: ' + testCase.name +
          ', URI: ' + testCase.uri, 'INFO');
        fs.write(testData.dumpDir + testCase.name + '.html', casper.getHTML(), 0);
      });
      testCase.steps.forEach(function (testStep) {
        nextStep(test, testCase, testStep, testData, logLabel);
        testsExecuted++;
      });
    });

    casper.run(function () {
      if (testsSuccessful == testsExecuted) {
        this.echo('SUCCESSFUL: ' + testsSuccessful + ' teststeps', 'INFO').exit(0);
      } else {
        this.echo('FAIL ' + testsSuccessful + ' successful and ' +
          (testsExecuted - testsSuccessful) + ' failed teststeps.', 'ERROR').exit(1);
      }
      test.done();
    });
  });
  */
}
