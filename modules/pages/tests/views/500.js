/**
 * Test for 500 error page elements
 */

'use strict';

const chai = require('chai'),
  chaiHttp = require('chai-http'),
  jsdom = require('jsdom'),
  assert = chai.assert,
  expect = chai.expect,
  { JSDOM } = jsdom;

chai.use(chaiHttp);

describe('/pages/tests/server/500.js', function () {
  describe('GET /error500/', function () {
    it('should have head and error message - en', function (done) {
      chai.request('http://localhost:8080')
        .get('/error500/')
        .set('Accept-Language', 'en;q=0.8,de;q=0.5')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(500);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          assert.equal(document.title, '500 - Server Error');
          const headline = document.getElementById('headline');
          assert.equal(headline.textContent, '500 - Server Error');
          done();
        });
    });
    it('should have head and error message - de', function (done) {
      chai.request('http://localhost:8080')
        .get('/error500/')
        .set('Accept-Language', 'de;q=0.8,en;q=0.5')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(500);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          assert.equal(document.title, '500 - Das hat nicht funktioniert.');
          const headline = document.getElementById('headline');
          assert.equal(headline.textContent, '500 - Das hat nicht funktioniert.');
          done();
        });
    });
  });
});
