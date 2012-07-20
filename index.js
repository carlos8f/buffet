var Stream = require('stream').Stream
  , inherits = require('util').inherits
  ;

function Buffet(buf, options) {
  var self = this;
  this.buf = buf;
  this.options = {};
  if (typeof options === 'number') {
    options = {chunkSize: options};
  }
  else if (typeof options === 'undefined') {
    options = {chunkSize: 1024};
  }
  if (typeof options === 'object') {
    Object.keys(options).forEach(function(k) {
      self.options[k] = options[k];
    });
  }
  Stream.call(this);
  this.writable = false;
  this.readable = true;
  this.paused = false;
  this._bufCursor = 0;
  if (!Buffer.isBuffer(this.buf)) {
    this.emit('eror', new Error('invalid buffer'));
  }
  else {
    this._bufLength = this.buf.length;
    process.nextTick(this._read.bind(this));
  }
};
inherits(Buffet, Stream);

module.exports = function(buf, options) {
  return new Buffet(buf, options);
};

Buffet.prototype.pause = function() {
  this.paused = true;
};

Buffet.prototype.resume = function() {
  this.paused = false;
};

Buffet.prototype._read = function() {
  if (!this.paused) {
    var chunkEnd = this._bufCursor + this.options.chunkSize;
    if (chunkEnd > this._bufLength) {
      chunkEnd = this._bufLength;
    }
    var chunk = this.buf.slice(this._bufCursor, chunkEnd);
    if (this.encoding) {
      this.emit('data', chunk.toString(this.encoding));
    }
    else {
      this.emit('data', chunk);
    }
    this._bufCursor += this.options.chunkSize;
    if (this._bufCursor > this._bufLength) {
      this.emit('end');
    }
    else {
      process.nextTick(this._read.bind(this));
    }
  }
};

Buffet.prototype.end = function() {};

// No cleanup necessary
Buffet.prototype.destroy = function() {};

Buffet.prototype.setEncoding = function(encoding) {
  this.encoding = encoding;
};