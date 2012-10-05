describe('image', function () {
  var test = setup();
  before(test.before);
  after(test.after);
  
  it('can serve an image', function (done) {
    var testPath = '/folder/Alice-white-rabbit.jpg';
    request(test.baseUrl + testPath, function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'image/jpeg');
      assert.deepEqual(data, fs.readFileSync(test.dir + testPath).toString());
      done();
    });
  });
});