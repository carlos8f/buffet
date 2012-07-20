var stalwart = require('../')
  , http = require('http')
  , assert = require('assert')
  , fs = require('fs')
  , zlib = require('zlib')
  , port = 33333
  ;

describe('simple test', function() {
  var imgBuf;
  before(function(done) {
    var stalwartHandler = stalwart('test/files', {recursive: true});
    http.createServer(function(req, res) {
      stalwartHandler(req, res, function() {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.write('file not found');
        res.end();
      });
    }).listen(port, done);
  });

  it('can serve a txt file', function(done) {
    var req = http.get('http://localhost:' + port + '/hello.txt', function(res) {
      assert.equal(res.headers['content-type'], 'text/plain');
      assert.ok(res.headers['last-modified']);
      assert.ok(res.headers['etag']);
      assert.equal(res.headers['vary'], 'Accept-Encoding');
      assert.ok(res.headers['date']);
      assert.equal(res.headers['cache-control'], 'public, max-age: 300');
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
    }).on('error', function(err) {
      console.error(err, 'error');
    });
    req.end();
  });

  it('can serve an image', function(done) {
    var req = http.get('http://localhost:' + port + '/folder/Alice-white-rabbit.jpg', function(res) {
      assert.equal(res.headers['content-type'], 'image/jpeg');
      assert.equal(res.statusCode, 200);

      var chunks = [];
      res.on('data', function(chunk) {
        chunks.push(chunk);
      });
      res.on('end', function() {
        assert.deepEqual(Buffer.concat(chunks), fs.readFileSync('test/files/folder/Alice-white-rabbit.jpg'));
        done();
      });
    }).on('error', function(err) {
      console.error(err, 'error');
    });
    req.end();
  });

  it('serves gzip', function(done) {
    var req = http.get({headers: {'Accept-Encoding': 'deflate, gzip'}, port: port, path: '/hello.txt'}, function(res) {
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
        assert.deepEqual(Buffer.concat(chunks), fs.readFileSync('test/files/hello.txt'));
        done();
      });
    }).on('error', function(err) {
      console.error(err, 'error');
    });
    req.end();
  });

  it('continues on 404', function(done) {
    var req = http.get('http://localhost:' + port + '/folder/not-there.txt', function(res) {
      assert.equal(res.headers['content-type'], 'text/plain');
      assert.equal(res.statusCode, 404);

      var data = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        assert.equal(data, 'file not found');
        done();
      });
    }).on('error', function(err) {
      console.error(err, 'error');
    });
    req.end();
  });
});
