describe('gzip', function () {
  var test = setup();
  before(test.before);
  after(test.after);
  
  it('serves gzip', function (done) {
    var testPath = '/hello.txt';
    var chunks = [];
    request({url: test.baseUrl + testPath, headers: {'Accept-Encoding': 'deflate, gzip'}})
      .pipe(zlib.createGunzip())
      .on('data', function (chunk) {
        chunks.push(chunk);
      })
      .once('end', function () {
        assert.deepEqual(Buffer.concat(chunks), fs.readFileSync(test.dir + testPath));
        done();
      });
  });
});