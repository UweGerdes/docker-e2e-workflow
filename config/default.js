/**
 * Testdata for vcards
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

const domain = 'http://e2e-workflow:8080';

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
        },
        'start': {
          title: 'Webapp',
          click: 'a[href="/app"]',
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
