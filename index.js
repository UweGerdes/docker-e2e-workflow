/*
 * Testing http workflows
 *
 * execute: node index.js --cfg=config/default.js
 *
 * The config file contains test cases and exports a test suite stucture.
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */
'use strict';

let viewportSize = { width: 1024, height: 768 };

//const { Builder, By, Key, until } = require('selenium-webdriver');
const { By } = require('selenium-webdriver'),
  webdriver = require('selenium-webdriver'),
  chrome = require('selenium-webdriver/chrome'),
  firefox = require('selenium-webdriver/firefox'),
  chai = require('chai'),
  assert = chai.assert,
  chaiAsPromised = require('chai-as-promised'),
  del = require('del'),
  fs = require('fs'),
  makeDir = require('make-dir'),
  argv = require('minimist')(process.argv.slice(2)),
  path = require('path'),
  log = require('./lib/log.js');

chai.use(chaiAsPromised);

let testData = null;

function by(selector) {
  if (selector.match(/^\/\/.+/)) {
    return By.xpath(selector);
  } else {
    return By.css(selector);
  }
}

if (argv.cfg) {
  const filename = argv.cfg;
  if (fs.existsSync(path.join(__dirname, filename))) {
    log.info('Executing: "' + path.join(__dirname, filename) + '"');
    testData = require(path.join(__dirname, filename));
  } else {
    log.info('ERROR: file not found: "' + path.join(__dirname, filename) + '"');
  }
} else {
  log.info('Executing default: "' + path.join(__dirname, 'config', 'default.js') + '"');
  testData = require(path.join(__dirname, 'config', 'default.js'));
}
if (testData) {
  let promise = del([path.join(testData.dumpDir, '*')], { force: true })
    .then(() => makeDir(path.join(testData.dumpDir)));
  log.setFilename(path.join(testData.dumpDir, 'results.json'));
  if (testData.viewportSize) {
    viewportSize = testData.viewportSize;
  }
  let driver = buildDriver(viewportSize);
  driver.manage().window().setRect(viewportSize);
  Object.entries(testData.testCases).forEach(
    ([name, testCase]) => {
      promise = promise.then(() => log.testCase(name))
      .then(() => makeDir(path.join(testData.dumpDir, name)))
      .then(() => driver.get(testCase.uri));
      Object.entries(testCase.steps).forEach(
        ([label, testStep]) => {
          promise = promise.then(() => log.testStep(label, testStep));
          if (testStep.title) {
            promise = promise
            .then(() => driver.getTitle())
            .then((title) => assert.equal(title, testStep.title))
            .catch((e) => log.error('title: ' + e.message));
          }
          if (testStep.input) {
            Object.keys(testStep.input).forEach(
              (selector) => {
                // text / textarea
                if (typeof testStep.input[selector] === 'string') {
                  promise = promise
                  .then(() => driver.findElement(by(selector)).clear())
                  .then(() => driver.findElement(by(selector)).sendKeys(testStep.input[selector]))
                  .catch((e) => log.error('no input field for ' + selector + e.toString()));
                } else
                // checkbox: true/false, radio: true, select: true
                if (testStep.input[selector] === true || testStep.input[selector] === false) {
                  promise = promise
                  .then(() => driver.findElement(by(selector)).isSelected())
                  .then(
                    (selected) => {
                      if (selected !== testStep.input[selector]) {
                        return driver.findElement(by(selector)).click();
                      }
                    }
                  )
                  .catch(() => log.error('no input field for ' + selector));
                } else {
                  console.log('input unprocessed', selector, testStep.input[selector]);
                }
              }
            );
          }
          if (testStep.click) {
            promise = promise
            .then(() => driver.findElement(by(testStep.click)).click())
            .catch(() => log.error('no element to click: ' + testStep.click));
          }
          Object.keys(testStep.elements).forEach(
            (selector) => {
              promise = promise
              .then(() => driver.findElement(by(selector)).getText())
              .catch(() => log.error('element not found: "' + selector + '"'))
              .then(
                (text) => {
                  if (text && testStep.elements[selector]) {
                    assert.equal(text, testStep.elements[selector], '"' + selector + '" text');
                  }
                }
              )
              .catch((e) => log.error(e.message));
            }
          );
          if (testStep.elementsNotExist) {
            testStep.elementsNotExist.forEach(
              (selector) => {
                promise = promise
                .then(
                  () => {
                    try {
                      return driver.findElement(by(selector));
                    }
                    catch (error) {
                      return selector + error.toString();
                    }
                  }
                )
                .then(() => log.error('element found: "' + selector + '"'))
                .catch(() => {});
              }
            );
          }
          promise = promise
          .then(() => driver.takeScreenshot())
          .then(
            (screenshot) => saveFile(
                path.join(testData.dumpDir, name, label + '.png'),
                new Buffer(screenshot, 'base64')
              )
          );
        }
      );
    }
  );
  promise.then(saveResults)
  .then(
    () => driver.quit(),
    e => driver.quit().then(() => log.info(e.message))
  );
}

function buildDriver(viewportSize) {
  return new webdriver.Builder()
    .forBrowser('chrome')
    .usingServer('http://e2e-hub:4444/wd/hub')
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
}

function saveFile(file, content) {
  return new Promise(
    (resolve, reject) => {
      fs.writeFile(
        file,
        content,
        (error) => {
          if (error) {
            log.error(file + ' save error: ' + error);
            reject('file not saved');
          } else {
            resolve(file + 'saved');
          }
        }
      );
    }
  );
}

function saveResults() {
  const results = log.results();
  log.summary();
  return saveFile(path.join(testData.dumpDir, 'results.json'),
    JSON.stringify(results, null, 4)
  );
}
