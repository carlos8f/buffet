var buffet = require('../')
  , http = require('http')
  , assert = require('assert')
  , fs = require('fs')
  , zlib = require('zlib')
  , idgen = require('idgen')
  , rimraf = require('rimraf')
  , ncp = require('ncp').ncp
  , port = Math.round(Math.random() * 20000 + 20000)
  , baseUrl = 'http://localhost:' + port
  , cleanup = true
  ;

describe('simple test', function() {
  var testFolder = '/tmp/buffet-test-' + idgen();
  before(function(done) {
    ncp('test/files', testFolder, function(err) {
      assert.ifError(err);
      var handler = buffet(testFolder);
      http.createServer(function(req, res) {
        handler(req, res, function() {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.write('file not found');
          res.end();
        });
      }).listen(port, done);
    });
  });
  after(function(done) {
    if (cleanup) {
      rimraf(testFolder, function(err) {
        assert.ifError(err);
        done();
      });
    }
    else {
      done();
    }
  });

  it('can serve a txt file', function(done) {
    var req = http.get(baseUrl + '/hello.txt?test=1', function(res) {
      assert.equal(res.headers['content-type'], 'text/plain');
      assert.ok(res.headers['last-modified']);
      assert.ok(res.headers['etag']);
      assert.equal(res.headers['vary'], 'Accept-Encoding');
      assert.ok(res.headers['date']);
      assert.equal(res.headers['cache-control'], 'public, max-age: 300');
      assert.equal(res.headers['connection'], 'keep-alive');
      assert.equal(res.statusCode, 200);
      var data = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        assert.equal(data, 'hello world!');
        done();
      });
    }).on('error', assert.ifError);
    req.end();
  });

  it('can serve an image', function(done) {
    var testPath = '/folder/Alice-white-rabbit.jpg';
    var req = http.get(baseUrl + testPath, function(res) {
      assert.equal(res.headers['content-type'], 'image/jpeg');
      assert.equal(res.statusCode, 200);

      var chunks = [];
      res.on('data', function(chunk) {
        chunks.push(chunk);
      });
      res.on('end', function() {
        assert.deepEqual(Buffer.concat(chunks), fs.readFileSync(testFolder + testPath));
        done();
      });
    }).on('error', assert.ifError);
    req.end();
  });

  it('serves gzip', function(done) {
    var testPath = '/hello.txt';
    var req = http.get({headers: {'Accept-Encoding': 'deflate, gzip'}, port: port, path: testPath}, function(res) {
      assert.equal(res.headers['content-type'], 'text/plain');
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-encoding'], 'gzip');

      var decodedStream = zlib.createGunzip();
      res.pipe(decodedStream);

      var chunks = [];
      decodedStream.on('data', function(chunk) {
        chunks.push(chunk);
      });
      decodedStream.on('end', function() {
        assert.deepEqual(Buffer.concat(chunks), fs.readFileSync(testFolder + testPath));
        done();
      });
    }).on('error', assert.ifError);
    req.end();
  });

  it('continues on 404', function(done) {
    var testPath = '/folder/not-there.txt';
    var req = http.get(baseUrl + testPath, function(res) {
      assert.equal(res.statusCode, 404);
      assert.equal(res.headers['content-type'], 'text/plain');

      var data = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        assert.equal(data, 'file not found');
        done();
      });
    }).on('error', assert.ifError);
    req.end();
  });

  describe('watcher', function() {
    var testData = {yay: true}, folderName = idgen();
    before(function(done) {
      fs.mkdir(testFolder + '/folder/' + folderName, function(err) {
        assert.ifError(err);
        // Give some time for the watcher to pick up the directory
        setTimeout(function () {
          fs.writeFile(testFolder + '/folder/' + folderName + '/test.json', JSON.stringify(testData), function(err) {
            assert.ifError(err);
            // Give time for the watcher to pick up the file
            setTimeout(done, 100);
          });
        }, 100);
      });
    });

    it('serves a dynamically created file', function(done) {
      var req = http.get(baseUrl + '/folder/' + folderName + '/test.json', function(res) {
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-type'], 'application/json');

        var data = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
          assert.deepEqual(JSON.parse(data), testData);
          done();
        });
      }).on('error', assert.ifError);
      req.end();
    });

    it('serves an updated file', function(done) {
      testData.boo = false;
      fs.writeFile(testFolder + '/folder/' + folderName + '/test.json', JSON.stringify(testData), function(err) {
        assert.ifError(err);
        // Give the watcher some time.
        setTimeout(function() {
          var req = http.get(baseUrl + '/folder/' + folderName + '/test.json', function(res) {
            assert.equal(res.statusCode, 200);
            assert.equal(res.headers['content-type'], 'application/json');

            var data = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
              data += chunk;
            });
            res.on('end', function() {
              assert.deepEqual(JSON.parse(data), testData);
              done();
            });
          }).on('error', assert.ifError);
          req.end();
        }, 100);
      });
    });

    it('serves a 404 after removing dynamic file', function(done) {
      rimraf(testFolder + '/folder/' + folderName, function(err) {
        assert.ifError(err);
        // Give some time for the watcher to pick up directory delete
        setTimeout(function() {
          var req = http.get(baseUrl + '/folder/' + folderName + '/test.json', function(res) {
            assert.equal(res.statusCode, 404);
            assert.equal(res.headers['content-type'], 'text/plain');

            var data = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
              data += chunk;
            });
            res.on('end', function() {
              assert.equal(data, 'file not found');
              done();
            });
          }).on('error', assert.ifError);
          req.end();
        }, 100);
      });
    });

    it("doesn't serve a .-prefixed file", function(done) {
      var req = http.get(baseUrl + '/.htaccess', function(res) {
        assert.equal(res.statusCode, 404);
        assert.equal(res.headers['content-type'], 'text/plain');

        var data = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
          assert.equal(data, 'file not found');
          done();
        });
      }).on('error', assert.ifError);
      req.end();
    });
  });
});
