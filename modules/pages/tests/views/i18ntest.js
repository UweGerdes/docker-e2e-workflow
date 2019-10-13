/**
 * Test for i18n translations from /modules/pages/tests/locales
 */

'use strict';

const chai = require('chai'),
  chaiHttp = require('chai-http'),
  jsdom = require('jsdom'),
  assert = chai.assert,
  expect = chai.expect,
  { JSDOM } = jsdom;

chai.use(chaiHttp);

describe('/pages/tests/server/i18n-test.js', function () {
  describe('GET /i18n-ejs/', function () {
    it('should show test translations - en', function (done) {
      chai.request('http://localhost:8080')
        .get('/i18n-ejs/')
        .set('Accept-Language', 'en;q=0.8,de;q=0.5')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          assert.equal(document.title, 'Module');
          const headline = document.getElementById('headline');
          assert.equal(headline.textContent, 'i18n Test');
          const translateString = document.getElementById('translate-string');
          assert.equal(translateString.textContent, 'Translate String');
          const plurals = document.querySelector('#plurals-one');
          assert.equal(plurals.textContent, 'Number one');
          const plurals2 = document.querySelector('#plurals-two');
          assert.equal(plurals2.textContent, 'Number 2');
          done();
        });
    });
    it('should show test translations - de', function (done) {
      chai.request('http://localhost:8080')
        .get('/i18n-ejs/')
        .set('Accept-Language', 'de;q=0.8,en;q=0.5')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          assert.equal(document.title, 'Module');
          const headline = document.getElementById('headline');
          assert.equal(headline.textContent, 'i18n Test');
          const translateString = document.getElementById('translate-string');
          assert.equal(translateString.textContent, 'Zeichenkette übersetzen');
          const plurals = document.querySelector('#plurals-one');
          assert.equal(plurals.textContent, 'Zahl eins');
          const plurals2 = document.querySelector('#plurals-two');
          assert.equal(plurals2.textContent, 'Zahl 2');
          done();
        });
    });
    it('should show test translations - en', function (done) {
      chai.request('http://localhost:8080')
        .get('/i18n-ejs/?lang=de')
        .set('Accept-Language', 'en;q=0.8,de;q=0.5')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          assert.equal(document.title, 'Module');
          const headline = document.getElementById('headline');
          assert.equal(headline.textContent, 'i18n Test');
          const translateString = document.getElementById('translate-string');
          assert.equal(translateString.textContent, 'Zeichenkette übersetzen');
          const plurals = document.querySelector('#plurals-one');
          assert.equal(plurals.textContent, 'Zahl eins');
          const plurals2 = document.querySelector('#plurals-two');
          assert.equal(plurals2.textContent, 'Zahl 2');
          done();
        });
    });
  });
});
