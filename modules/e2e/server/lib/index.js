/*
 * Testing http end-to-end workflow
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

'use strict';

const { Builder, By } = require('selenium-webdriver'),
  chrome = require('selenium-webdriver/chrome'),
  firefox = require('selenium-webdriver/firefox'),
  chai = require('chai'),
  assert = chai.assert,
  chaiAsPromised = require('chai-as-promised'),
  chalk = require('chalk'),
  dateFormat = require('dateformat'),
  del = require('del'),
  fs = require('fs'),
  makeDir = require('make-dir'),
  argv = require('minimist')(process.argv.slice(2)),
  path = require('path');

chai.use(chaiAsPromised);

let testData = null,
  driver;

const filename = argv.cfg || path.join('config', 'default.js');
// const driverBrowser = 'firefox'
const driverBrowser = 'chrome';

const configPath = path.join('/home', 'node', 'app', filename);
if (fs.existsSync(configPath)) {
  log('Executing: "' + configPath + '"');
  testData = require(configPath);
} else {
  throw (new Error('ERROR: file not found: "' + configPath + '"'));
}

const testCaseHandler = {
  title: async (testStep) => {
    const title = await driver.getTitle();
    try {
      assert.equal(title, testStep.title);
    } catch (error) {
      err(testStep, 'title: ' + error.message);
    }
  },
  elements: async (testStep) => {
    let elements = [];
    for (const selector of Object.keys(testStep.elements)) {
      elements.push(
        driver.findElement(by(selector))
          .then((element) => {
            element.getText()
              .then((text) => {
                if (testStep.elements[selector]) {
                  assert.equal(text, testStep.elements[selector], '"' + selector + '" text');
                }
                return Promise.resolve();
              })
              .catch((error) => {
                err(testStep, error.message);
                return Promise.resolve();
              });
          })
          .catch(() => {
            err(testStep, 'element "' + selector + '" not found');
            return Promise.resolve();
          })
      );
    }
    try {
      await Promise.all(elements);
    } catch (errors) {
      console.log(errors);
    }
  },
  elementsNotExist: (testStep) => {
    async function testElement(selector) {
      try {
        await driver.findElement(by(selector));
        err(testStep, 'element "' + selector + '" should not exist');
      } catch (error) { } // eslint-disable-line no-empty
    }
    for (const selector of testStep.elementsNotExist) {
      testElement(selector);
    }
  }
};

(async () => {
  driver = await buildDriver(driverBrowser);
  for (const [viewportName, viewportSize] of Object.entries(testData.viewports)) {
    const resultPath = path.join('/home', 'node', 'app', 'results2', filename.replace(/\.js$/, ''), viewportName);
    log(chalk.blue.bold.inverse('starting ' + testData.name + ': ' + viewportName) + ' ' + resultPath);
    testData.summary = {
      executed: 0, success: 0, fail: 0, total: 0
    };
    let vpSize = { ...viewportSize };
    if (driverBrowser === 'chrome') {
      vpSize.height += 110;
    }
    try {
      await del([resultPath], { force: true });
      for (const [testCaseName, testCase] of Object.entries(testData.testCases)) {
        try {
          await makeDir(path.join(resultPath, testCaseName));
          await driver.get(testCase.uri);
          await driver.manage().window().setRect(vpSize);
          for (const [label, testStep] of Object.entries(testCase.steps)) {
            testData.summary.total++;
            log(testCaseName + ': ' + label);
            testStep.errors = [];
            if (testStep.title) {
              await testCaseHandler.title(testStep);
            }
            if (testStep.elements) {
              await testCaseHandler.elements(testStep);
            }
            if (testStep.elementsNotExist) {
              await testCaseHandler.elementsNotExist(testStep);
            }
            if (testStep.input) {
              for (const selector of Object.keys(testStep.input)) {
                let element = null;
                try {
                  element = await driver.findElement(by(selector));
                } catch (error) {
                  err(testStep, 'input field "' + selector + '" not found');
                }
                if (element) {
                  if (typeof testStep.input[selector] === 'string') {
                    // text / textarea
                    await element.clear();
                    await driver.findElement(by(selector)).sendKeys(testStep.input[selector]);
                  } else if (testStep.input[selector] === true || testStep.input[selector] === false) {
                    // checkbox: true/false, radio: true, select+option: true
                    const selected = await driver.findElement(by(selector)).isSelected();
                    if (selected !== testStep.input[selector]) {
                      await driver.findElement(by(selector)).click();
                    }
                  } else {
                    err(testStep, 'input unprocessed: ' + selector + ' ' + testStep.input[selector]);
                  }
                }
              }
            }
            let clickElement;
            if (testStep.click) {
              try {
                clickElement = await driver.findElement(by(testStep.click));
                await driver.executeScript('arguments[0].scrollIntoView();', clickElement);
                testStep.clickRect = await clickElement.getRect();
                testStep.clickRect.scrollTop = await driver.executeScript('return document.body.scrollTop;');
              } catch (error) {
                err(testStep, 'no element to click: ' + testStep.click + ' ' + error);
              }
            }
            await driver.executeScript('document.body.scrollTop = 0;');
            const screenshot = await driver.takeScreenshot();
            await saveFile(
              path.join(resultPath, testCaseName, label + '.png'),
              Buffer.from(screenshot, 'base64')
            );
            if (testStep.click) {
              if (clickElement) {
                await clickElement.click();
              }
            }
            if (testStep.errors.length === 0) {
              testData.summary.success++;
            } else {
              testData.summary.fail++;
            }
            testData.summary.executed++;
          }
        } catch (err) {
          log(chalk.red(err));
        }
      }
    } catch (err) {
      log(chalk.red(err));
    } finally {
      await saveFile(path.join(resultPath, 'results.json'), JSON.stringify(testData, null, 4));
      if (testData.summary.fail === 0) {
        log(chalk.green.bold.inverse('Executed ' + testData.summary.executed + ' steps, no errors'));
      } else {
        log(chalk.red.bold.inverse('Executed ' + testData.summary.executed + ' steps, ' +
          testData.summary.fail + ' failed'));
      }
    }
  }
  if (driver) {
    await driver.quit();
  }
})();

function buildDriver (driverBrowser) {
  return new Builder()
    .forBrowser(driverBrowser)
    .usingServer('http://' + process.env.HUB_HOST + ':' + process.env.HUB_PORT + '/wd/hub')
    .setChromeOptions(new chrome.Options().addArguments('--kiosk').headless())
    .setFirefoxOptions(new firefox.Options().headless())
    .build();
}

function by (selector) {
  if (selector.match(/^\/\/.+/)) {
    return By.xpath(selector);
  } else {
    return By.css(selector);
  }
}

function log (message) {
  console.log('[' + chalk.gray(dateFormat(new Date(), 'HH:MM:ss')) + '] ' + message);
}

function err (testStep, message) {
  log(chalk.red(message));
  testStep.errors.push(message);
}

function saveFile (file, content) {
  return new Promise(
    (resolve, reject) => {
      fs.writeFile(
        file,
        content,
        (error) => {
          if (error) {
            log(chalk.red(file + ' save error: ' + error));
            reject(new Error('file not saved'));
          } else {
            resolve(file + ' saved');
          }
        }
      );
    }
  );
}
