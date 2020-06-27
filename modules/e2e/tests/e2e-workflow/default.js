/**
 * Testdata for e2e-workflow default
 *
 * @module modules/e2e/tests/e2e-workflow/default
 */

const domain = 'http://' + (process.env.TEST_SERVER || process.env.HOSTNAME) + ':8080';

module.exports = {
  group: 'Default Test',
  name: 'E2E Workflow',
  viewports: {
    'Mobile': { width: 320, height: 568 },
    'Tablet': { width: 768, height: 1024 },
    'Desktop': { width: 1200, height: 900 }
  },
  testCases: {
    'homepage': {
      uri: domain,
      steps: {
        'all fail': {
          title: 'WebserverX',
          elements: {
            '//h1': 'Webserver',
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
    }
    /*
    'e2e': {
      uri: domain,
      steps: {
        'home': {
          title: 'E2E Workflow',
          elements: {
            '//h1': 'E2E Workflow',
            '//a[@href="/app"]': 'Hier starten'
          },
          elementsNotExist: [
            '//a[@href="/app/config/default.js"]'
          ]
        }
      }
    },
    'open app': {
      uri: domain,
      steps: {
        'home2': {
          title: 'Webapp',
          elements: {
            '//h1': 'E2E-Workflow Tests',
            '//a[@href="/app"]': 'Hier starten'
          },
          click: 'a[href="/app"]'
        },
        'start': {
          title: 'Webserver - E2E Workflow',
          elements: {
            '//h1': 'Keine Config geladen',
            '//a[@href="/app/config/default.js?viewport=Mobile"]': 'E2E Workflow'
          },
          elementsNotExist: [
            '//a[@href="/app"]'
          ]
        }
      }
    }
    */
  }
};
