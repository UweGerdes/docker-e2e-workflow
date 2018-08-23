/*
 * Testing http end-to-end workflow
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */
'use strict'

let viewportSize = { width: 1024, height: 768 }

const { Builder, By } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const firefox = require('selenium-webdriver/firefox')
const chai = require('chai')
const assert = chai.assert
const chaiAsPromised = require('chai-as-promised')
const del = require('del')
const fs = require('fs')
const makeDir = require('make-dir')
const argv = require('minimist')(process.argv.slice(2))
const path = require('path')
const log = require('./lib/log.js')

chai.use(chaiAsPromised)

let testData = null
const filename = argv.cfg || path.join('config', 'default.js')

function by (selector) {
  if (selector.match(/^\/\/.+/)) {
    return By.xpath(selector)
  } else {
    return By.css(selector)
  }
}

if (fs.existsSync(path.join(__dirname, filename))) {
  log.info('Executing: "' + path.join(__dirname, filename) + '"')
  testData = require(path.join(__dirname, filename))
} else {
  log.info('ERROR: file not found: "' + path.join(__dirname, filename) + '"')
}

const resultPath = path.join(__dirname, 'results', filename.replace(/\.js$/, ''));

(async () => {
  let driver
  testData.summary = { executed: 0, success: 0, fail: 0, total: 0 }
  try {
    await del([resultPath], { force: true })
    driver = await buildDriver(viewportSize)
    for (const [testCaseName, testCase] of Object.entries(testData.testCases)) {
      try {
        await makeDir(path.join(resultPath, testCaseName))
        await driver.get(testCase.uri)
        for (const [label, testStep] of Object.entries(testCase.steps)) {
          testData.summary.total++
          console.log(testCaseName, '-', label)
          testStep.errors = []
          if (testStep.title) {
            const title = await driver.getTitle()
            try {
              assert.equal(title, testStep.title)
            } catch (error) {
              console.log('title: ' + error.message)
              testStep.errors.push('title: ' + error.message)
            }
          }
          if (testStep.elements) {
            for (const selector of Object.keys(testStep.elements)) {
              let element = null
              try {
                element = await driver.findElement(by(selector))
              } catch (error) {
                console.log('element "' + selector + '" not found')
                testStep.errors.push('element "' + selector + '" not found')
              }
              if (element) {
                try {
                  const text = await element.getText()
                  if (testStep.elements[selector]) {
                    assert.equal(text, testStep.elements[selector], '"' + selector + '" text')
                  }
                } catch (error) {
                  console.log(error.message)
                  testStep.errors.push(error.message)
                }
              }
            }
          }
          if (testStep.elementsNotExist) {
            for (const selector of testStep.elementsNotExist) {
              try {
                await driver.findElement(by(selector))
                console.log('element "' + selector + '" should not exist')
                testStep.errors.push('element "' + selector + '" should not exist')
              } catch (error) { }
            }
          }
          if (testStep.input) {
            for (const selector of Object.keys(testStep.input)) {
              let element = null
              try {
                element = driver.findElement(by(selector))
              } catch (error) {
                console.log('element "' + selector + '" not found')
                testStep.errors.push('input field "' + selector + '" not found')
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
                  console.log('input unprocessed', selector, testStep.input[selector])
                }
              }
            }
          }
          const screenshot = await driver.takeScreenshot()
          await saveFile(
            path.join(resultPath, testCaseName, label + '.png'),
            Buffer.from(screenshot, 'base64')
          )
          if (testStep.click) {
            try {
              const element = await driver.findElement(by(testStep.click))
              testStep.clickRect = await element.getRect()
              await element.click()
            } catch (error) {
              console.log('no element to click: ' + testStep.click)
              testStep.errors.push('no element to click: ' + testStep.click)
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
        console.log(err)
      }
    }
  } catch (err) {
    console.log(err)
  } finally {
    if (driver) {
      await driver.quit()
    }
    await saveFile(path.join(resultPath, 'results.json'), JSON.stringify(testData, null, 4))
  }
})()

function buildDriver (viewportSize) {
  return new Builder()
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
    .build()
}

function saveFile (file, content) {
  return new Promise(
    (resolve, reject) => {
      fs.writeFile(
        file,
        content,
        (error) => {
          if (error) {
            console.log(file + ' save error: ' + error)
            reject(new Error('file not saved'))
          } else {
            console.log(file, 'saved')
            resolve(file + 'saved')
          }
        }
      )
    }
  )
}
