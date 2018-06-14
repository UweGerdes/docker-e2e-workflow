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
          '//a[@id="editButton"]',
        ],
      },
      {
        name: 'vcard 0',
        title: 'Webserver - vcard',
        click: 'a[href="/vcards/0/"]',
        alerts: [],
        elements: {
          '//*[@id="version"]//*[@class="itemvalue"]': '2.1',
          '//a[@id="editButton"]': '',
        },
      },
      {
        name: 'vcard 1',
        title: 'Webserver - vcard',
        click: 'a[href="/vcards/1/"]',
        alerts: [],
        elements: {
          '//*[@id="version"]//*[@class="itemvalue"]': '3.0',
        },
      },
      {
        name: 'search',
        title: 'Webserver - vcard',
        click: '#searchButton',
        alerts: [],
        elements: {
          '//*[@class="searchHeadline"]': 'Suchen',
          '//form[@name="searchForm"]': '',
          '//form[@name="searchForm"]//*[@id="search_version"]': '',
          '//form[@name="searchForm"]//*[@for="search_version"]': 'Version',
        }
      },
      {
        name: 'searchResult',
        title: 'Webserver - vcard',
        click: 'input[type="submit"]',
        alerts: [],
        elements: {
          '//*[@id="searchLayer"]/div/h2': 'Suchen',
          '//a[@class="button open"]': 'öffnen',
        },
      },
      {
        name: 'vcard 0',
        title: 'Webserver - vcard',
        click: '*[id="searchLayer"] a[href="/vcards/0/"]',
        alerts: [],
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
