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

//const { Builder, By, Key, until } = require('selenium-webdriver');
const { By } = require('selenium-webdriver');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

let viewportSize = { width: 1024, height: 768 };

const chai = require('chai'),
  assert = chai.assert,
  //expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  fs = require('fs'),
  makeDir = require('make-dir'),
  argv = require('minimist')(process.argv.slice(2)),
  path = require('path');

chai.use(chaiAsPromised);

let testData = null;
//let testsSuccessful = 0;
//let testsExecuted = 0;
//let errorCount = 0;

if (argv.cfg) {
  const filename = argv.cfg;
  console.log('config filename:', filename);
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
//console.log('testData', testData);

if (testData) {
  makeDir(testData.dumpDir);

  if (testData.viewportSize) {
    viewportSize = testData.viewportSize;
  }

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

  // TODO: 404, 500, console.log, error

  // TODO: let browserAlerts = []; collect alerts

  testData.testCases.forEach(function (testCase) {
    console.log('Test: ' + testData.name + ', Testcase: ' + testCase.name +
      ', URI: ' + testCase.uri);

    let promise = driver.get(testCase.uri);

    if (testCase.title) {
      promise = promise.then(() => driver.getTitle());
      promise = promise.then(
        (title) => {
          console.log('title', title);
          assert.equal(title, testCase.title);
        }
      );
    }
    testCase.steps.forEach(
      (testStep) => {
        promise = promise.then(() => console.log('Test-Step:', testStep.name));
        if (testStep.title) {
          promise = promise.then(
            () => driver.getTitle()
          )
          .then(
            (title) => {
              assert.equal(title, testStep.title);
            }
          );
        }
        if (testStep.input) {
          Object.keys(testStep.input).forEach(
            (selector) => {
              // text / textarea
              if (typeof testStep.input[selector] === 'string') {
                promise = promise.then(() => {
                    return driver.findElement(By.xpath(selector))
                      .sendKeys(testStep.input[selector]);
                  }
                )
                .then(() => {
                    return driver.findElement(By.xpath(selector)).getAttribute('value');
                  }
                )
                .catch((e) => { console.log(e.message); });
              } else
              // checkbox: true/false, radio: true
              if (testStep.input[selector] === true || testStep.input[selector] === false) {
                promise = promise.then(() => {
                    return driver.findElement(By.xpath(selector)).isSelected();
                  }
                )
                .then(
                  (selected) => {
                    if (selected !== testStep.input[selector]) {
                      return driver.findElement(By.xpath(selector)).click();
                    }
                  }
                )
                .catch((e) => { console.log(e.message); });
              } else {
                console.log('input unprocessed', selector, testStep.input[selector]);
              }
            }
          );
        }
        if (testStep.click) {
          promise = promise.then(
            () => {
              return driver.findElement(By.css(testStep.click)).click();
            }
          );
        }
        Object.keys(testStep.elements).forEach(
          (selector) => {
            promise = promise.then(() => {
                return driver.findElement(By.xpath(selector)).getText();
              }
            )
            .then(
              (text) => {
                if (testStep.elements[selector]) {
                  assert.equal(text, testStep.elements[selector], selector + ' text');
                }
              }
            )
            .catch((e) => { console.log(e.message); });
          }
        );
        if (testStep.elementsNotExist) {
          testStep.elementsNotExist.forEach(
            (selector) => {
              promise = promise.then(() => {
                  try {
                    return driver.findElement(By.xpath(selector));
                  }
                  catch (error) {
                    return selector + error.toString();
                  }
                }
              )
              .then(() => {
                  console.log(selector, 'found ERROR');
                }
              )
              .catch(() => {});
            }
          );
        }
        promise = promise.then(
          () => {
            return driver.takeScreenshot();
          }
        )
        .then(
          (screenshot) => {
            return new Promise(
              (resolve, reject) => {
                fs.writeFile(
                  path.join(testData.dumpDir, testStep.name + '.png'),
                  new Buffer(screenshot, 'base64'),
                  (error) => {
                    if (error) {
                      console.log(path.join(testData.dumpDir, 'page.png'), 'save error:', error);
                      reject('file not saved');
                    } else {
                      resolve(path.join(testData.dumpDir, 'page.png'), 'saved');
                    }
                  }
                );
              }
            );
          }
        );
      }
    );

    promise.then(
      () => driver.quit(),
      e => driver.quit().then(() => { console.log(e.message); })
    );
  });
}
