describe('basic test', function () {
  var test = setup({watch: false});
  before(test.before);
  after(test.after);

  it('serves root index', function (done) {
    request(test.baseUrl + '/', function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert(data.match(/<h1>buffet<\/h1>/));
      done();
    });
  });

  it('can serve a txt file', function (done) {
    request(test.baseUrl + '/hello.txt?test=1', function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/plain');
      assert.ok(res.headers['last-modified']);
      assert.ok(res.headers['etag']);
      assert.ok(res.headers['date']);
      assert(!res.headers['cache-control']);

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

  it('returns 404 on malformed URI', function (done) {
    request(test.baseUrl + '/%', function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 404);
      done();
    });
  });
});
