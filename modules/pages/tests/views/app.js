/**
 * Test for page elements
 *
 * @requires module:lib/config
 */

'use strict';

const chai = require('chai'),
  chaiHttp = require('chai-http'),
  jsdom = require('jsdom'),
  assert = chai.assert,
  expect = chai.expect,
  { JSDOM } = jsdom;

chai.use(chaiHttp);

describe('/pages/tests/views/app.js', function () {
  describe('GET /app/', function () {
    it('should have head', function (done) {
      chai.request('http://localhost:8080')
        .get('/app/')
        .end(function (err, res) {
          const document = getDocument(res, err);
          assert.equal(document.title, 'Module');
          assert.equal(document.head.getElementsByTagName('link').length, 1);
          assert.equal(
            document.head.getElementsByTagName('link')[0].attributes.href.nodeValue,
            '/app.css'
          );
          const headline = document.getElementById('headline');
          assert.equal(headline.textContent, 'Module:');
          done();
        });
    });
    it('should have links to modules', function (done) {
      chai.request('http://localhost:8080')
        .get('/app/')
        .end(function (err, res) {
          const document = getDocument(res, err);
          const moduleLinks = document.querySelectorAll('.module-link');
          assert.isAtLeast(moduleLinks.length, 1, 'moduleLinks');
          done();
        });
    });
    it('should have footer', function (done) {
      chai.request('http://localhost:8080')
        .get('/app/')
        .end(function (err, res) {
          const document = getDocument(res, err);
          const footer = document.getElementById('footer');
          assert.equal(footer.textContent.trim(), '© 2019 Uwe Gerdes');
          assert.equal(
            document.body.getElementsByTagName('script')[0].attributes.src.nodeValue,
            'https://localhost:' + process.env.LIVERELOAD_PORT + '/livereload.js'
          );
          done();
        });
    });
  });
});

function getDocument (res, err) {
  expect(err).to.be.null;
  expect(res).to.have.status(200);
  expect(res).to.be.html;
  return (new JSDOM(res.text)).window.document;
}
