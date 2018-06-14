/**
 * Testdata for acteam Neukunden-Anmeldung und Datenbearbeitung
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

/* jshint esversion: 5, varstmt: false */

var domain = 'http://vcards-dev:8080';
var testCases = [];

testCases.push(
  {
    name: 'vcard-index',
    uri: domain + '/vcards/',
    title: 'Webserver - vcard',
    steps: [
      {
        name: 'start',
        title: 'Webserver - vcard',
        elements: {
          '//h1[@class="headline"]': 'vcard',
          '//*[@id="list"]/li[1]/a': 'Uwe Gerdes',
          '//*[@id="list"]/li[2]/a': 'Uwe Gerdes',
          '//*[@id="searchButton"]': 'suchen',
          '//*[@id="headlineButtons"]/*[@class="button datasetName"]': 'testdata',
        },
        elementsNotExist: [
          '//a[@class="editButton"]',
        ],
      },
      {
        name: 'vcard 0',
        click: 'a[href="/vcards/0/"]',
        title: 'Webserver - vcard',
        alerts: [],
        waitForSelector: '//*[@id="content"]',
        elements: {
          '//*[@id="version"]//*[@class="itemvalue"]': '2.1',
        },
      },
      {
        name: 'vcard 1',
        click: 'a[href="/vcards/1/"]',
        title: 'Webserver - vcard',
        alerts: [],
        waitForSelector: '//*[@id="content"]',
        elements: {
          '//*[@id="version"]//*[@class="itemvalue"]': '3.0',
        },
      },
      {
        name: 'search',
        click: '#searchButton',
        title: 'Webserver - vcard',
        alerts: [],
        waitUntilVisible: '//*[@id="searchButton"]',
        elements: {
          '//*[@class="searchHeadline"]': 'Suchen',
          '//form[@name="searchForm"]': '',
          '//form[@name="searchForm"]//*[@id="search_version"]': '',
          '//form[@name="searchForm"]//*[@for="search_version"]': 'Version',
        }
      },
      {
        name: 'searchResult',
        click: 'input[type="submit"]',
        title: 'Webserver - vcard',
        alerts: [],
        waitForSelector: '//*[@class="result-list"]',
        elements: {
          '//*[@id="searchLayer"]/div/h2': 'Suchen',
          '//a[@class="button open"]': 'öffnen',
        },
      },
      {
        name: 'vcard 0',
        click: '*[id="searchLayer"] a[href="/vcards/0/"]',
        title: 'Webserver - vcard',
        alerts: [],
        waitForSelector: '//*[@id="content"]',
        elements: {
          '//*[@id="version"]//*[@class="itemvalue"]': '2.1',
        },
      },
    ]
  }
);

module.exports = {
  name: 'default',
  dumpDir: './results/default/',
  viewportSize: { width: 850, height: 700 },
  testCases: testCases
};
