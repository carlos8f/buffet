assert = require('assert')
buffet = require('../')
fs = require('fs')
zlib = require('zlib')
idgen = require('idgen')
rimraf = require('rimraf')
ncp = require('ncp').ncp
path = require('path')
http = require('http')
request = require('request')
middler = require('middler')

setup = function (options) {
  var test = {
    dir: '/tmp/buffet-test-' + idgen(),
    port: Math.round(Math.random() * 2e4 + 2e4),
    before: function (done) {
      test.baseUrl = 'http://localhost:' + test.port;
      ncp(path.resolve(__dirname, 'files'), test.dir, function (err) {
        assert.ifError(err);
        var handler = buffet(test.dir, options);
        test.server = http.createServer();
        middler()
          .add(handler)
          .add(handler.notFound)
          .attach(test.server)
        test.server.listen(test.port, done);
      });
    },
    after: function (done) {
      rimraf(test.dir, function (err) {
        assert.ifError(err);
        test.server.close();
        done();
      });
    }
  };
  return test;
};