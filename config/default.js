/**
 * Testdata for vcards
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

const domain = 'http://' + process.env.HOSTNAME + ':8080';

module.exports = {
  name: 'default test e2e workflow',
  dumpDir: './results/default/',
  viewportSize: { width: 1500, height: 1024 },
  testCases: {
    'homepage': {
      name: 'open page',
      uri: domain,
      steps: {
        'home': {
          title: 'Webapp',
          elements: {
            '//h1': 'E2E-Workflow Tests',
            '//a[@href="/app"]': 'Hier starten',
          },
          elementsNotExist: [
            '//a[@href="/app/config/default.js"]',
          ],
        },
      }
    },
    'open app': {
      name: 'open app',
      uri: domain,
      steps: {
        'home2': {
          title: 'Webapp',
          elements: {
            '//h1': 'E2E-Workflow Tests',
            '//a[@href="/app"]': 'Hier starten',
          },
          click: 'a[href="/app"]',
        },
        'start': {
          title: 'Webserver -',
          elements: {
            '//h1': 'Keine Config geladen: undefined',
            '//a[@href="/app/config/default.js"]': 'config/default.js',
          },
          elementsNotExist: [
            '//a[@href="/app"]',
          ],
        },
      }
    },
  }
};
