describe('basic test', function () {
  var test = setup({watch: false});
  before(test.before);
  after(test.after);

  it('can serve a txt file', function (done) {
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

  it('continues on 404', function (done) {
    var testPath = '/folder/not-there.txt';
    request(test.baseUrl + testPath, function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 404);
      done();
    });
  });

  it("doesn't serve a .-prefixed file", function (done) {
    request(test.baseUrl + '/.htaccess', function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 404);
      done();
    });
  });

  it('returns 400 on malformed URI', function (done) {
    request(test.baseUrl + '/%', function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 400);
      done();
    });
  });
});
