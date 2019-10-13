/**
 * Test for 404 error page elements
 */

'use strict';

const chai = require('chai'),
  chaiHttp = require('chai-http'),
  jsdom = require('jsdom'),
  assert = chai.assert,
  expect = chai.expect,
  { JSDOM } = jsdom;

chai.use(chaiHttp);

describe('/pages/tests/server/404.js', function () {
  describe('GET /nonexistant/', function () {
    it('should have head and error message - en', function (done) {
      chai.request('http://localhost:8080')
        .get('/nonexistant/')
        .set('Accept-Language', 'en;q=0.8,de;q=0.5')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(404);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          assert.equal(document.title, '404 - Page not found');
          const headline = document.getElementById('headline');
          assert.equal(headline.textContent, '404 - Page not found');
          done();
        });
    });
    it('should have head and error message - de', function (done) {
      chai.request('http://localhost:8080')
        .get('/nonexistant/')
        .set('Accept-Language', 'de;q=0.8,en;q=0.5')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(404);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          assert.equal(document.title, '404 - Seite nicht gefunden');
          const headline = document.getElementById('headline');
          assert.equal(headline.textContent, '404 - Seite nicht gefunden');
          done();
        });
    });
  });
});
