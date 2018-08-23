/*
 * Testing http workflows
 *
 * execute: node index.js --cfg=config/default.js
 *
 * The config file contains test cases and exports a test suite stucture.
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */
'use strict'

let viewportSize = { width: 1024, height: 768 }

// const { Builder, By, Key, until } = require('selenium-webdriver');
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
let filename = path.join('config', 'default.js')

function by (selector) {
  if (selector.match(/^\/\/.+/)) {
    return By.xpath(selector)
  } else {
    return By.css(selector)
  }
}

if (argv.cfg) {
  filename = argv.cfg
}

if (fs.existsSync(path.join(__dirname, filename))) {
  log.info('Executing: "' + path.join(__dirname, filename) + '"')
  testData = require(path.join(__dirname, filename))
} else {
  log.info('ERROR: file not found: "' + path.join(__dirname, filename) + '"')
}

const resultPath = path.join(__dirname, 'results', 'test', filename.replace(/\.js$/, ''));

(async () => {
  let driver
  try {
    await del([resultPath], { force: true })
    driver = await buildDriver(viewportSize)
    for (const [testCaseName, testCase] of Object.entries(testData.testCases)) {
      try {
        console.log(testCaseName, testCase.uri)
        await makeDir(path.join(resultPath, testCaseName))
        await driver.get(testCase.uri)
        for (const [label, testStep] of Object.entries(testCase.steps)) {
          console.log(label)
          if (testStep.title) {
            const title = await driver.getTitle()
            try {
              assert.equal(title, testStep.title)
            } catch (error) {
              console.log('title: ' + error.message)
            }
          }
        }
      } catch (err) {
        console.log(err)
      } finally {
        const fail = 'test'
        if (fail === 'body') {
          await del([path.join('test', testData.dumpDir, '*')], { force: true })
          await buildDriver(viewportSize)
          assert.equal('test', 'test')
          by('body')
          saveResults()
        }
      }
    }
  } catch (err) {
    console.log(err)
  } finally {
    if (driver) {
      await driver.quit()
    }
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
            log.error(file + ' save error: ' + error)
            reject(new Error('file not saved'))
          } else {
            resolve(file + 'saved')
          }
        }
      )
    }
  )
}

function saveResults () {
  const results = log.results()
  log.summary()
  return saveFile(path.join(testData.dumpDir, 'results.json'),
    JSON.stringify(results, null, 4)
  )
}
