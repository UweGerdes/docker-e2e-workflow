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
  fs = require('fs'),
  makeDir = require('make-dir'),
  argv = require('minimist')(process.argv.slice(2)),
  path = require('path'),
  log = require('./lib/log.js');

chai.use(chaiAsPromised);

let testData = null;

if (argv.cfg) {
  const filename = argv.cfg;
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
if (testData) {
  makeDir(testData.dumpDir);
  log.setFilename(path.join(testData.dumpDir, 'results.json'));
  if (testData.viewportSize) {
    viewportSize = testData.viewportSize;
  }
  let driver = new webdriver.Builder()
    .forBrowser('chrome')
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
  driver.manage().window().setRect(viewportSize);
  testData.testCases.forEach(function (testCase) {
    log.testCase(testCase.name);
    let promise = driver.get(testCase.uri);
    if (testCase.title) {
      promise = promise.then(() => driver.getTitle());
      promise = promise.then(
        (title) => {
          log.info('testCase title: ' + title);
          assert.equal(title, testCase.title);
        }
      )
      .catch(
        (e) => {
          console.log('error testCase title: ' + e.message);
        }
      );
    }
    Object.entries(testCase.steps).forEach(
      ([label, testStep]) => {
        promise = promise.then(
          () => {
            log.testStep(label, testStep);
          }
        );
        if (testStep.title) {
          promise = promise.then(
            () => driver.getTitle()
          )
          .then(
            (title) => {
              assert.equal(title, testStep.title);
            }
          )
          .catch(
            (e) => {
              log.error('title: ' + e.message);
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
                .catch(() => { log.error('no input field for ' + selector); });
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
            let err = false;
            promise = promise.then(() => {
                return driver.findElement(By.xpath(selector)).getText();
              }
            )
            .catch(
              () => {
                log.error('element not found: "' + selector + '"');
                err = true;
              }
            );
            promise = promise.then(
              (text) => {
                if (!err && testStep.elements[selector]) {
                  assert.equal(text, testStep.elements[selector], '"' + selector + '" text');
                }
              }
            )
            .catch((e) => { log.error(e.message); });
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
                  log.error('element found: "' + selector + '"');
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
                const filename = path.join(testData.dumpDir, label + '.png');
                fs.writeFile(
                  filename,
                  new Buffer(screenshot, 'base64'),
                  (error) => {
                    if (error) {
                      log.error(filename + ' save error: ' + error);
                      reject('file not saved');
                    } else {
                      log.screenshot(filename);
                      resolve(filename + 'saved');
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
      () => {
        console.log('results in', log.filename());
        return new Promise(
          (resolve, reject) => {
            const filename = path.join(testData.dumpDir, 'results.json');
            fs.writeFile(
              filename,
              JSON.stringify(log.results(), null, 4),
              (error) => {
                if (error) {
                  log.error(filename + ' save error: ' + error);
                  reject('file not saved');
                } else {
                  resolve(filename + 'saved');
                }
              }
            );
          }
        );
      }
    )
    .then(
      () => driver.quit(),
      e => driver.quit().then(() => { console.log(e.message); })
    );
  });
}

