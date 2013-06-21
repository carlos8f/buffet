describe('watcher', function() {
  var test = setup();
  before(test.before);
  after(test.after);

  var testData = {yay: true}, folderName = idgen();
  before(function (done) {
    fs.mkdir(test.dir + '/folder/' + folderName, function (err) {
      assert.ifError(err);
      fs.writeFile(test.dir + '/folder/' + folderName + '/test.json', JSON.stringify(testData), function(err) {
        assert.ifError(err);
        // Give time for the watcher to pick up the file
        setTimeout(done, 1000);
      });
    });
  });

  it('serves a dynamically created file', function (done) {
    request(test.baseUrl + '/folder/' + folderName + '/test.json', function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'application/json');
      assert.deepEqual(JSON.parse(data), testData);
      done();
    });
  });

  it('serves an updated file', function (done) {
    testData.boo = false;
    fs.writeFile(test.dir + '/folder/' + folderName + '/test.json', JSON.stringify(testData), function (err) {
      assert.ifError(err);
      // Give the watcher some time.
      setTimeout(function () {
        request(test.baseUrl + '/folder/' + folderName + '/test.json', function (err, res, data) {
          assert.ifError(err);
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['content-type'], 'application/json');
          assert.deepEqual(JSON.parse(data), testData);
          done();
        });
      }, 1000);
    });
  });

  it('serves a 404 after removing dynamic file', function (done) {
    rimraf(test.dir + '/folder/' + folderName, function (err) {
      assert.ifError(err);
      // Give some time for the watcher to pick up directory delete
      setTimeout(function () {
        request(test.baseUrl + '/folder/' + folderName + '/test.json', function (err, res, data) {
          assert.ifError(err);
          assert.equal(res.statusCode, 404);
          done();
        });
      }, 1000);
    });
  });
});