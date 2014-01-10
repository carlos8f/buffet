var middler = require('middler');

describe('keep-alive', function () {
  var test = setup({watch: false});
  before(test.before);
  after(test.after);

  before(function () {
    middler(test.server).first('/7-seconds', function (req, res, next) {
      setTimeout(function () {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('that was 7 seconds');
      }, 7000);
    });
  });

  it("don't kill me (concurrent)", function (done) {
    var started = new Date(), ended = false, shortOk = false;

    // a short buffet request, setting req.connection.setTimeout(5000, ...)
    request(test.baseUrl + '/hello.txt?test=1', function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/plain');
      assert.ok(res.headers['last-modified']);
      assert.ok(res.headers['etag']);
      assert.equal(res.headers['vary'], 'Accept-Encoding');
      assert.ok(res.headers['date']);
      assert.equal(res.headers['cache-control'], 'public, max-age=300');
      assert.equal(res.headers['connection'], 'keep-alive');
      assert.equal(res.headers['keep-alive'], 'timeout=5');

      assert.equal(data, 'hello world!');
      assert(!ended);
      shortOk = true;
    });

    // a long request. does the connection get killed?
    setTimeout(function () {
      assert(shortOk);
      request(test.baseUrl + '/7-seconds', function (err, res, data) {
        assert.ifError(err);
        assert(!ended);
        assert.equal(res.statusCode, 200);
        assert.equal(data, 'that was 7 seconds');
        assert(new Date().getTime() - started >= 7000);
        ended = true;
        done();
      });
    }, 200);
  });

  it('short request', function (done) {
    request(test.baseUrl + '/hello.txt?test=1', function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/plain');
      assert.ok(res.headers['last-modified']);
      assert.ok(res.headers['etag']);
      assert.equal(res.headers['vary'], 'Accept-Encoding');
      assert.ok(res.headers['date']);
      assert.equal(res.headers['cache-control'], 'public, max-age=300');
      assert.equal(res.headers['connection'], 'keep-alive');

      assert.equal(data, 'hello world!');
      done();
    });
  });

  it("don't kill me (subsequent)", function (done) {
    var started = new Date();
    request(test.baseUrl + '/7-seconds', function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert.equal(data, 'that was 7 seconds');
      assert(new Date().getTime() - started >= 7000);
      done();
    });
  });
});
