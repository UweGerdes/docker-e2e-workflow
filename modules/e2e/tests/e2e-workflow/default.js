/**
 * Testdata for e2e-workflow default
 *
 * @module modules/e2e/tests/e2e-workflow/default
 */

const domain = 'http://' + (process.env.TEST_SERVER || process.env.HOSTNAME) + ':8080';

module.exports = {
  group: 'Default Test',
  name: 'E2E Workflow Selftest',
  viewports: {
    // 'Mobile': { width: 320, height: 568 },
    'Tablet': { width: 768, height: 1024 }
    // 'Desktop': { width: 1200, height: 900 }
  },
  testCases: {
    'homepage': {
      uri: domain,
      steps: {
        'all tests should fail': {
          title: 'WebserverX',
          elements: {
            '//h1': 'WebserverX',
            '//*[@class="header"]//a[@href="/appX/"]': 'Home',
            '//*[@class="content"]//a[@href="/app/"]': 'StartseiteX'
          },
          elementsNotExist: [
            '//*[@class="content"]//a[@href="/app/"]'
          ],
          input: {
            '//*[@class="content"]': 'Text-Eingabe'
          },
          click: [
            '//*[@class="content"]//a[@href="/fail/"]'
          ]
        },
        'check elements': {
          title: 'Webserver',
          elements: {
            '//h1': 'Webserver',
            '//*[@class="header"]//a[@href="/app/"]': 'Home',
            '//*[@class="content"]//a[@href="/app/"]': 'Startseite'
          },
          elementsNotExist: [
            '//*[@class="error"]'
          ],
          click: '//*[@class="content"]//a[@href="/app/"]'
        }
      }
    },
    'app': {
      uri: domain + '/app/',
      steps: {
        'home': {
          title: 'Module',
          elements: {
            '//h1': 'Module:',
            '//a[@href="/e2e/"]': 'E2E Workflow'
          },
          elementsNotExist: [
            '//a[@href="/app/config/default.js"]'
          ]
        }
      }
    },
    'e2e': {
      uri: domain + '/e2e/',
      steps: {
        'home': {
          title: 'E2E Workflow',
          elements: {
            '//h1': 'Keine Config geladen',
            '#configs .config a': 'E2E Workflow'
          },
          elementsNotExist: [
            '//a[@href="/app/config/default.js"]'
          ]
        }
      }
    }
  }
};
