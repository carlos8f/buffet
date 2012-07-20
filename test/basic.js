var buffet = require('../')
  , assert = require('assert')
  , http = require('http')
  , fs = require('fs')
  , Stream = require('stream').Stream
  ;

describe('basic test', function() {
  var buf;
  before(function(done) {
    var req = http.get('http://images.wikia.com/americanmcgeesalice/images/8/83/Alice-white-rabbit.jpg', function(res) {
      var chunks = [];
      res.on('data', function(data) {
        chunks.push(data);
      });
      res.on('end', function() {
        buf = Buffer.concat(chunks);
        assert(buf.length > 1000);
        done();
      });
    }).on('error', function(err) {
      console.error(err);
    });
    req.end();
  });

  it('should stream the buffer in many parts', function(done) {
    var src = buffet(buf), dest = new Stream(), chunks = [];
    dest.writable = true;
    dest.readable = false;
    dest.on('data', function(chunk) {
      chunks.push(chunk);
    });
    dest.on('end', function() {
      assert.equal(chunks.length, Math.ceil(buf.length / src.options.chunkSize));
      assert.deepEqual(Buffer.concat(chunks), buf);
      done();
    });
    dest.write = function(buf) {
      this.emit('data', buf);
    };
    dest.end = function(buf) {
      if (buf) this.write(buf);
      this.emit('end');
    };
    src.pipe(dest);
  });
});