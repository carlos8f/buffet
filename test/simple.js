var stalwart = require('../')
  , http = require('http')
  , assert = require('assert')
  , port = 33333
  ;

describe('simple test', function() {
  before(function(done) {
    var stalwartHandler = stalwart('test/files');
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
});
