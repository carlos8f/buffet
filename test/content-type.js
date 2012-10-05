describe('content type', function () {
  describe('default', function () {
    var test = setup();
    before(test.before);
    after(test.after);

    it('defaults to application/octet-stream', function (done) {
      request(test.baseUrl + '/index', function (err, res, data) {
        assert.ifError(err);
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-type'], 'application/octet-stream');
        done();
      });
    });
  });
  
  describe('default override', function () {
    var defaultType = 'text/something';
    var test = setup({defaultContentType: defaultType, watch: false});
    before(test.before);
    after(test.after);

    it('serves detected content type', function (done) {
      request(test.baseUrl + '/index.html', function (err, res, data) {
        assert.ifError(err);
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-type'], 'text/html');
        done();
      });
    });

    it('honors default content type option', function (done) {
      request(test.baseUrl + '/index', function (err, res, data) {
        assert.ifError(err);
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-type'], defaultType);
        done();
      });
    });
  });
});