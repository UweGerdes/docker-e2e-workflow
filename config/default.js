/**
 * Testdata for vcards
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

const domain = 'http://' + process.env.HOSTNAME + ':8080'

module.exports = {
  group: 'Default Test',
  name: 'E2E Workflow',
  viewports: {
    'Mobile': { width: 320, height: 568 },
    'Tablet Portrait': { width: 768, height: 1024 },
    'Desktop': { width: 1200, height: 900 }
  },
  testCases: {
    'homepage': {
      uri: domain,
      steps: {
        'home': {
          title: 'Webapp',
          elements: {
            '//h1': 'E2E-Workflow Tests',
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
            '//a[@href="/app/config/default.js"]': 'default test e2e workflow'
          },
          elementsNotExist: [
            '//a[@href="/app"]'
          ]
        }
      }
    }
  }
}
