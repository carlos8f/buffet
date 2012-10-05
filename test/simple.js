describe('simple test', function () {
  var test = setup();
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
      assert.equal(res.headers['cache-control'], 'public, max-age: 300');
      assert.equal(res.headers['connection'], 'keep-alive');

      assert.equal(data, 'hello world!');
      done();
    });
  });

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

  it('continues on 404', function (done) {
    var testPath = '/folder/not-there.txt';
    request(test.baseUrl + testPath, function (err, res, data) {
      assert.ifError(err);
      assert.equal(res.statusCode, 404);
      done();
    });
  });

  describe('defaultContentType', function () {
    var dcPort = 42917
      , dcBaseUrl = 'http://localhost:' + dcPort
      , dcTestFolder = '/tmp/buffet-test-' + idgen()
      , defaultType = 'text/crazy'
      ;

    beforeEach(function (done) {
      ncp('test/files', dcTestFolder, done);
    });

    afterEach(function (done) {
      rimraf(dcTestFolder, done);
    });

    it('serves the proper content type even if the mime is detected', function (done) {
      //i think there is a bug in node module fs-watch-tree. set watch to true and you'll
      //see the test 'serves an updated file' fail occasionally
      var handler = buffet(dcTestFolder, {defaultContentType: defaultType, watch: false}); 
         
      var server = http.createServer(handler).listen(dcPort, function () {
        var req = http.get(dcBaseUrl + '/index.html', function (res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['content-type'], 'text/html');
          req.end();
          server.close(done);
        });
      });
    });

    it('serves the default content type specified in the options if it cant detect the mime', function (done) {
      var handler = buffet(dcTestFolder, {defaultContentType: defaultType, watch: false}); 

      var server = http.createServer(handler).listen(dcPort, function () {
        var req = http.get(dcBaseUrl + '/index', function (res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['content-type'], defaultType);
          req.end();
          server.close(done);
        });
      });
    });

    it('serves the application/octet-stream when no defaultContentType is and it cant detect the mime', function (done) {
      var handler = buffet(dcTestFolder, {watch: false}); 

      var server = http.createServer(handler).listen(dcPort, function () {
        var req = http.get(dcBaseUrl + '/index', function (res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['content-type'], 'application/octet-stream');
          req.end();
          server.close(done);
        });
      });
    });

  
  });

  describe('watcher', function() {
    var testData = {yay: true}, folderName = idgen();
    before(function (done) {
      fs.mkdir(test.dir + '/folder/' + folderName, function (err) {
        assert.ifError(err);
        // Give some time for the watcher to pick up the directory
        setTimeout(function () {
          fs.writeFile(test.dir + '/folder/' + folderName + '/test.json', JSON.stringify(testData), function(err) {
            assert.ifError(err);
            // Give time for the watcher to pick up the file
            setTimeout(done, 100);
          });
        }, 100);
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
        }, 100);
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
        }, 100);
      });
    });

    it("doesn't serve a .-prefixed file", function (done) {
      request(test.baseUrl + '/.htaccess', function (err, res, data) {
        assert.ifError(err);
        assert.equal(res.statusCode, 404);
        done();
      });
    });
  });
});
