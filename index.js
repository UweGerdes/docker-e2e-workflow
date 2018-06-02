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

/* jshint esversion: 5, varstmt: false, phantom: true */
// jscs:disable jsDoc

/* globals casper, document, XPathResult */

var fs = require('fs'),
  x = require('casper').selectXPath;

var testData = null;
var testsSuccessful = 0;
var testsExecuted = 0;

if (casper.cli.options.cfg) {
  var path = casper.cli.options.cfg;
  if (fs.exists(fs.absolute(fs.workingDirectory + '/' + path))) {
    casper.echo('Executing: "' + fs.absolute(fs.workingDirectory + '/' + path) + '"', 'INFO');
    testData = require(fs.absolute(fs.workingDirectory + '/' + path));
  } else {
    casper.echo('ERROR: file not found: "' + fs.absolute(fs.workingDirectory + '/' + path) + '"');
  }
} else {
  casper.echo('Executing default: "' + fs.absolute(fs.workingDirectory + '/config/default.js') +
    '"', 'INFO');
  testData = require(fs.absolute(fs.workingDirectory + '/config/default.js'));
}

casper.options.waitTimeout = 20000;

var errorCount = 0;
if (testData) {
  fs.makeTree(testData.dumpDir);

  if (testData.viewportSize) {
    casper.options.viewportSize = testData.viewportSize;
  } else {
    casper.options.viewportSize = { width: 1024, height: 768 };
  }

  casper.on('http.status.404', function (resource) {
    this.echo('Error 404: ' + resource.url, 'WARNING');
  });
  /* jslint unused: false */
  casper.on('error', function (msg, trace) {
    this.echo('error: ' + msg, 'ERROR');
  });
  /* jslint unused: true */
  casper.on('remote.message', function (msg) {
    this.echo('remote.message: ' + msg, 'INFO');
  });
  casper.on('page.error', function (msg, trace) {
    this.echo('page.error ' + errorCount + ': ' + msg + '\n' + trace2string(trace), 'WARNING');
    fs.write('pageError' + errorCount + '.html', casper.getHTML(), 0);
    casper.capture('pageError' + errorCount + '.png', undefined, { format: 'png' });
    errorCount++;
  });

  var browserAlerts = [];
  casper.on('remote.alert', function (message) {
    browserAlerts.push(message);
    console.log('// alert: ' + message);
  });

  casper.test.begin('Test: ' + testData.name, function suite(test) {
    casper.start();

    testData.testCases.forEach(function (testCase) {
      var logLabel = testData.name + ' ' + testCase.name + ': ';

      casper.thenOpen(testCase.uri, function () {
        this.echo('Test: ' + testData.name + ', Testcase: ' + testCase.name + ', URI: ' + testCase.uri, 'INFO');
        fs.write(testData.dumpDir + testCase.name + '.html', casper.getHTML(), 0);
        if (testCase.title) {
          test.assertEquals(this.getTitle(), testCase.title, logLabel + 'page title before submit');
        }
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
} else {
  casper.test.done();
}

function nextStep(test, testCase, testStep, testData, logLabel) {
  casper.then(function () {
    this.echo('Test: ' + testCase.name + ' ' + testStep.name, 'INFO');
    browserAlerts = [];
    if (testStep.input) {
      test.assertExists(testStep.input[0], logLabel + testStep.input[0] + ' element found');
      this.fill(testStep.input[0], testStep.input[1], false);
    }
    if (testStep.inputXPath) {
      test.assertExists(testStep.inputXPath[0], logLabel + testStep.inputXPath[0] +
        ' element found');
      this.fillXPath(testStep.inputXPath[0], testStep.inputXPath[1], false);
    }
  });
  if (testStep.waitForSelector) {
    casper.then(function () {
      casper.waitForSelector({ type: 'xpath', path: testStep.waitForSelector });
    });
  }
  if (testStep.click) {
    casper.then(function () {
      casper.click(x(testStep.click));
    });
  }
  casper.then(function () {
    if (testStep.title) {
      var timeout = 20000;
      if (testStep.titleTimeout) {
        timeout = testStep.titleTimeout;
      }
      casper.waitForSelector({ type: 'xpath',
        path: '//head/title[text()="' +  testStep.title + '"]' },
        function () {
          fs.write(testData.dumpDir + testCase.name + '_' + testStep.name + '.html',
            casper.getHTML(), 0);
          casper.capture(testData.dumpDir + testCase.name + '_' + testStep.name + '.png', undefined,
            { format: 'png' });
        },
        function () {
          fs.write(testData.dumpDir + testCase.name + '_' + testStep.name + '.html',
            casper.getHTML(), 0);
          casper.capture(testData.dumpDir + testCase.name + '_' + testStep.name + '.png', undefined,
            { format: 'png' });
          casper.echo('Title not found: ' + testCase.name + ' ' + testStep.name + ' expected: "' +
            testStep.title + '"', 'ERROR');
        },
        timeout)
      ;
    } else {
      fs.write(testData.dumpDir + testCase.name + '_' + testStep.name + '.html', casper.getHTML(),
        0);
      casper.capture(testData.dumpDir + testCase.name + '_' + testStep.name + '.png', undefined,
        { format: 'png' });
    }
  });
  casper.then(function () {
    if (testStep.hasOwnProperty('alerts')) {
      test.assertEquals(browserAlerts, testStep.alerts, logLabel + 'alerts');
    }
    Object.keys(testStep.elements).forEach(function (selector) {
      test.assertExists(x(selector), logLabel + selector + ' element found');
      if (testStep.elements[selector] || testStep.elements[selector] === false) {
        if (typeof testStep.elements[selector] === 'string') {
          test.assertEquals(casper.fetchText(x(selector)).trim(), testStep.elements[selector],
            logLabel + selector + ' content');
        } else {
          test.assertEquals(casper.isChecked(selector), testStep.elements[selector], logLabel +
            selector + ' content');
        }
      }
    });
    if (testStep.elementsNotExist) {
      testStep.elementsNotExist.forEach(function (selector) {
        test.assertNotExists(x(selector), logLabel + selector + ' element not there');
      });
    }
    testsSuccessful++;
  });
}

casper.isChecked = function (selector) {
  /* jshint browser: true */
  var result = this.evaluate(function (selector) {
    var el = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      .singleNodeValue;
    return el ? el.checked : null;
  }, selector);
  /* jshint browser: false */
  if (result === null) {
    casper.echo('Selector not found', 'WARNING');
  }
  return result;
};

function trace2string(trace) {
  var result = [];
  Object.keys(trace).forEach(function (entry) {
    var lines = [];
    Object.keys(trace[entry]).forEach(function (key) {
      lines.push(trace[entry][key]);
    });
    result.push(lines.join(' '));
  });
  return result.join('\n');
}
