/*
 * Testing http end-to-end workflow
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */
'use strict'

const { Builder, By } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const firefox = require('selenium-webdriver/firefox')
const chai = require('chai')
const assert = chai.assert
const chaiAsPromised = require('chai-as-promised')
const chalk = require('chalk')
const dateFormat = require('dateformat')
const del = require('del')
const fs = require('fs')
const makeDir = require('make-dir')
const argv = require('minimist')(process.argv.slice(2))
const path = require('path')

chai.use(chaiAsPromised)

let testData = null
const filename = argv.cfg || path.join('config', 'default.js')
const driverBrowser = 'chrome'

if (fs.existsSync(path.join(__dirname, filename))) {
  log('Executing: "' + path.join(__dirname, filename) + '"')
  testData = require(path.join(__dirname, filename))
} else {
  throw (new Error('ERROR: file not found: "' + path.join(__dirname, filename) + '"'))
}

(async () => {
  let driver = await buildDriver(driverBrowser)
  for (const [viewportName, viewportSize] of Object.entries(testData.viewports)) {
    const resultPath = path.join(__dirname, 'results', filename.replace(/\.js$/, ''), viewportName)
    await log(chalk.blue.bold.inverse('starting ' + testData.name + ': ' + viewportName) + ' ')
    testData.summary = { executed: 0, success: 0, fail: 0, total: 0 }
    let vpSize = { ...viewportSize }
    if (driverBrowser === 'chrome') {
      vpSize.height += 110
    }
    try {
      await del([resultPath], { force: true })
      for (const [testCaseName, testCase] of Object.entries(testData.testCases)) {
        try {
          await makeDir(path.join(resultPath, testCaseName))
          await driver.get(testCase.uri)
          await driver.manage().window().setRect(vpSize)
          for (const [label, testStep] of Object.entries(testCase.steps)) {
            testData.summary.total++
            log(testCaseName + ': ' + label)
            testStep.errors = []
            if (testStep.title) {
              const title = await driver.getTitle()
              try {
                assert.equal(title, testStep.title)
              } catch (error) {
                err(testStep, 'title: ' + error.message)
              }
            }
            if (testStep.elements) {
              for (const selector of Object.keys(testStep.elements)) {
                let element = null
                try {
                  element = await driver.findElement(by(selector))
                } catch (error) {
                  err(testStep, 'element "' + selector + '" not found')
                }
                if (element) {
                  try {
                    const text = await element.getText()
                    if (testStep.elements[selector]) {
                      assert.equal(text, testStep.elements[selector], '"' + selector + '" text')
                    }
                  } catch (error) {
                    err(testStep, error.message)
                  }
                }
              }
            }
            if (testStep.elementsNotExist) {
              for (const selector of testStep.elementsNotExist) {
                try {
                  await driver.findElement(by(selector))
                  err(testStep, 'element "' + selector + '" should not exist')
                } catch (error) { }
              }
            }
            if (testStep.input) {
              for (const selector of Object.keys(testStep.input)) {
                let element = null
                try {
                  element = driver.findElement(by(selector))
                } catch (error) {
                  err(testStep, 'input field "' + selector + '" not found')
                }
                if (element) {
                  if (typeof testStep.input[selector] === 'string') {
                    // text / textarea
                    await element.clear()
                    await driver.findElement(by(selector)).sendKeys(testStep.input[selector])
                  } else if (testStep.input[selector] === true || testStep.input[selector] === false) {
                    // checkbox: true/false, radio: true, select+option: true
                    const selected = await driver.findElement(by(selector)).isSelected()
                    if (selected !== testStep.input[selector]) {
                      await driver.findElement(by(selector)).click()
                    }
                  } else {
                    err(testStep, 'input unprocessed: ' + selector + ' ' + testStep.input[selector])
                  }
                }
              }
            }
            let clickElement
            if (testStep.click) {
              try {
                clickElement = await driver.findElement(by(testStep.click))
                await driver.executeScript('arguments[0].scrollIntoView();', clickElement)
                testStep.clickRect = await clickElement.getRect()
                if (driverBrowser === 'chrome') {
                  testStep.clickRect.scrollTop = await driver.executeScript('return document.body.scrollTop;')
                }
              } catch (error) {
                err(testStep, 'no element to click: ' + testStep.click + ' ' + error)
              }
            }
            const screenshot = await driver.takeScreenshot()
            await saveFile(
              path.join(resultPath, testCaseName, label + '.png'),
              Buffer.from(screenshot, 'base64')
            )
            if (testStep.click) {
              if (clickElement) {
                await clickElement.click()
              }
            }
            if (testStep.errors.length === 0) {
              testData.summary.success++
            } else {
              testData.summary.fail++
            }
            testData.summary.executed++
          }
        } catch (err) {
          log(chalk.red(err))
        }
      }
    } catch (err) {
      log(chalk.red(err))
    } finally {
      await saveFile(path.join(resultPath, 'results.json'), JSON.stringify(testData, null, 4))
      if (testData.summary.fail === 0) {
        log(chalk.green.bold.inverse('Executed ' + testData.summary.executed + ' steps, no errors'))
      } else {
        log(chalk.red.bold.inverse('Executed ' + testData.summary.executed + ' steps, ' +
          testData.summary.fail + ' failed'))
      }
    }
  }
  if (driver) {
    await driver.quit()
  }
})()

function buildDriver (driverBrowser) {
  return new Builder()
    .forBrowser(driverBrowser)
    .usingServer('http://' + process.env.HUB_HOST + ':' + process.env.HUB_PORT + '/wd/hub')
    .setChromeOptions(new chrome.Options().addArguments('--kiosk').headless())
    .setFirefoxOptions(new firefox.Options().headless())
    .build()
}

function by (selector) {
  if (selector.match(/^\/\/.+/)) {
    return By.xpath(selector)
  } else {
    return By.css(selector)
  }
}

function log (message) {
  console.log('[' + chalk.gray(dateFormat(new Date(), 'HH:MM:ss')) + '] ' + message)
}

function err (testStep, message) {
  log(chalk.red(message))
  testStep.errors.push(message)
}

function saveFile (file, content) {
  return new Promise(
    (resolve, reject) => {
      fs.writeFile(
        file,
        content,
        (error) => {
          if (error) {
            log(chalk.red(file + ' save error: ' + error))
            reject(new Error('file not saved'))
          } else {
            resolve(file + 'saved')
          }
        }
      )
    }
  )
}
