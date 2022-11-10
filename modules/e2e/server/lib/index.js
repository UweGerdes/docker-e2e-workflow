/**
 * Testing http end-to-end workflow
 *
 * @module modules/e2e/server/lib/index
 * @author Uwe Gerdes, entwicklung@uwegerdes.de
 */
/* eslint no-await-in-loop: 0 */

'use strict';

const { Builder, By, until } = require('selenium-webdriver'),
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

const filenames = argv.cfg || path.join('config', 'default.js');
const driverBrowser = 'firefox';
// const driverBrowser = 'chrome';

const testCaseHandler = {
  waitForElements: async (testStep) => {
    if (testStep.waitForElements) {
      try {
        for (const waitForElement of testStep.waitForElements) {
          await driver.wait(until.elementLocated(by(waitForElement)), 2000);
        }
      } catch (error) {
        if (error.name === 'InvalidSelectorError') {
          err(testStep, '"' + testStep.waitForElements + '" ' + error.message);
        } else {
          err(testStep, testStep.waitForElements + ' could not waitForElements: ' + error);
        }
      }
    }
  },
  title: async (testStep) => {
    if (testStep.title) {
      const title = await driver.getTitle();
      try {
        assert.equal(title, testStep.title);
      } catch (error) {
        err(testStep, 'title: ' + error.message);
      }
    }
  },
  hover: async (testStep) => {
    if (testStep.hover) {
      let hoverElement;
      try {
        hoverElement = await driver.findElement(by(testStep.hover));
        // await driver.executeScript('arguments[0].scrollIntoView();', hoverElement);
        testStep.hoverRect = await hoverElement.getRect();
        await driver.actions().move({ origin: hoverElement, x: 1, y: 1 }).perform();
      } catch (error) {
        if (error.name === 'InvalidSelectorError') {
          err(testStep, '"' + testStep.hover + '" ' + error.message);
        } else {
          err(testStep, testStep.hover + ' could not hover: ' + error.name);
        }
      }
    }
  },
  elements: async (testStep) => {
    if (testStep.elements) {
      let elements = [];
      for (const selector of Object.keys(testStep.elements)) {
        elements.push(
          driver.findElement(by(selector))
            .then((element) => {
              element.getText()
                .then((text) => {
                  if (testStep.elements[selector]) {
                    assert.equal(text, testStep.elements[selector], selector + ' text');
                  }
                  return Promise.resolve();
                })
                .catch((error) => {
                  err(testStep, error.message);
                  return Promise.resolve();
                });
            })
            .catch((error) => {
              if (error.name === 'InvalidSelectorError') {
                err(testStep, '"' + selector + '" ' + error.message);
                return Promise.reject(error.message);
              } else {
                err(testStep, selector + ' not found');
                return Promise.resolve();
              }
            })
        );
      }
      try {
        await Promise.all(elements);
      } catch (errors) {
        // console.log(errors);
      }
    }
  },
  elementsNotExist: (testStep) => {
    async function testElement(selector) {
      try {
        await driver.findElement(by(selector));
        err(testStep, selector + ' should not exist');
      } catch (error) {
        if (error.name === 'InvalidSelectorError') {
          err(testStep, '"' + selector + '" ' + error.message);
        }
      }
    }
    if (testStep.elementsNotExist) {
      for (const selector of testStep.elementsNotExist) {
        testElement(selector);
      }
    }
  },
  elementsNotVisible: (testStep) => {
    async function testElement(selector) {
      try {
        const element = await driver.findElement(by(selector));
        if (await element.isDisplayed()) {
          err(testStep, selector + ' should not be visible');
        }
      } catch (error) {
        if (error.name === 'InvalidSelectorError') {
          err(testStep, '"' + selector + '" ' + error.message);
        }
        err(testStep, selector + ' should exist');
      }
    }
    if (testStep.elementsNotVisible) {
      for (const selector of testStep.elementsNotVisible) {
        testElement(selector);
      }
    }
  },
  input: async (testStep) => {
    async function setValue(element, selector) {
      if (typeof testStep.input[selector] === 'string') {
        // text / textarea
        try {
          await element.clear();
          await element.sendKeys(testStep.input[selector]);
        } catch (error) {
          err(testStep, selector + ' no input field');
        }
      } else if (testStep.input[selector] === true || testStep.input[selector] === false) {
        // checkbox: true/false, radio: true, select+option: true
        if (await element.isSelected() !== testStep.input[selector]) {
          await element.click();
        }
      } else {
        err(testStep, selector + ' input unprocessed: ' + testStep.input[selector]);
      }
    }
    if (testStep.input) {
      let elements = [];
      for (const selector of Object.keys(testStep.input)) {
        elements.push(
          driver.findElement(by(selector))
            .then(async (element) => {
              await setValue(element, selector);
              return Promise.resolve();
            })
            .catch((error) => {
              if (error.name === 'InvalidSelectorError') {
                err(testStep, '"' + selector + '" ' + error.message);
                return Promise.reject(error.message);
              } else {
                err(testStep, selector + ' input field not found');
                return Promise.resolve();
              }
            })
        );
      }
      try {
        await Promise.all(elements);
      } catch (errors) {
        // console.log(errors);
      }
    }
  },
  click: async (testStep) => {
    if (testStep.click) {
      let clickElement;
      try {
        clickElement = await driver.findElement(by(testStep.click));
        await driver.executeScript('arguments[0].scrollIntoView();', clickElement);
        testStep.clickRect = await clickElement.getRect();
        await clickElement.click();
      } catch (error) {
        if (error.name === 'InvalidSelectorError') {
          err(testStep, '"' + testStep.click + '" ' + error.message);
        } else {
          err(testStep, testStep.click + ' could not click');
        }
      }
    }
  }
};

async function execTestStep(testCaseName, label, testStep, resultPath, viewportName) {
  testData.summary.total++;
  log('Test case: ' + testCaseName + ', test step: ' + label);
  testStep.errors = [];
  await testCaseHandler.waitForElements(testStep);
  await testCaseHandler.title(testStep);
  await testCaseHandler.hover(testStep);
  await testCaseHandler.elements(testStep);
  await testCaseHandler.elementsNotExist(testStep);
  await testCaseHandler.elementsNotVisible(testStep);
  await testCaseHandler.input(testStep);
  await driver.executeScript('window.scrollTo({ bottom: 0, right: 0 });');
  await driver.executeScript('window.scrollTo({ top: 0, left: 0 });');
  const vpSize = await driver.executeScript('return { width: window.innerWidth, scrollWidth: document.body.parentNode.scrollWidth, height: document.body.parentNode.scrollHeight };');
  if (vpSize.height > testData.viewports[viewportName].height) {
    testStep.verticalScrollbar[viewportName] = true;
  } else {
    testStep.verticalScrollbar[viewportName] = false;
  }
  if (driverBrowser === 'firefox') {
    vpSize.height += 74;
    if (vpSize.scrollWidth > vpSize.width) {
      vpSize.width = vpSize.scrollWidth + 7;
    }
  }
  if (driverBrowser === 'chrome') {
    if (vpSize.scrollWidth > vpSize.width) {
      vpSize.width = vpSize.scrollWidth + 10;
    }
  }
  await driver.manage().window().setRect(vpSize);
  await saveFile(
    path.join(resultPath, testCaseName, label + '.png'),
    Buffer.from(await driver.takeScreenshot(), 'base64')
  );
  await testCaseHandler.click(testStep);
  if (testStep.errors.length === 0) {
    testData.summary.success++;
  } else {
    testData.summary.fail++;
  }
  testData.summary.executed++;
}

(async () => {
  driver = await buildDriver(driverBrowser);
  driver.manage().logs().get('browser')
    .then(function(entries) {
      entries.forEach(function(entry) {
        console.log('[%s] %s', entry.level.name, entry.message);
      });
    })
    .catch(error => {
      // get rid of misleading error message
      if (driverBrowser === 'firefox' && error.toString().indexOf('HTTP method not allowed') < 0) {
        console.log('WARN', error);
      }
    });

  for (const filename of filenames.split(',')) {
    const configPath = path.join('/home', 'node', 'app', filename);
    if (fs.existsSync(configPath)) {
      log('Executing: "' + configPath + '"');
      testData = require(configPath);
    } else {
      throw (new Error('ERROR: file not found: "' + configPath + '", "' + argv.cfg + '"'));
    }

    for (const [viewportName, viewportSize] of Object.entries(testData.viewports)) {
      const resultPath = path.join('/home', 'node', 'app', 'results', filename.replace(/\.js$/, ''), viewportName);
      log(chalk.blue.bold.inverse('starting ' + testData.name + ': ' + viewportName));
      testData.summary = {
        executed: 0, success: 0, fail: 0, total: 0
      };
      let vpSize = { ...viewportSize };
      if (driverBrowser === 'firefox') {
        vpSize.height += 74;
      }
      try {
        await del([resultPath], { force: true });
        for (const [testCaseName, testCase] of Object.entries(testData.testCases)) {
          try {
            await makeDir(path.join(resultPath, testCaseName));
            await driver.get(testCase.uri);
            for (const [label, testStep] of Object.entries(testCase.steps)) {
              await driver.manage().window().setRect(vpSize);
              testStep.verticalScrollbar = { };
              await execTestStep(testCaseName, label, testStep, resultPath, viewportName);
            }
          } catch (err) {
            log(chalk.red(err));
          }
        }
      } catch (err) {
        log(chalk.red(err));
      } finally {
        await saveFile(path.join(resultPath, 'results.json'), JSON.stringify(testData, null, 2));
        if (testData.summary.fail === 0) {
          log(chalk.green.bold.inverse('Executed ' + testData.summary.executed + ' steps, no errors'));
        } else {
          log(chalk.red.bold.inverse('Executed ' + testData.summary.executed + ' steps, ' +
            testData.summary.fail + ' failed'));
        }
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
