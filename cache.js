var fs = require('fs')
  , mime = require('mime')
  , hash = require('node_hash')
  , gzip = require('./gzip').gzip
  , sync = require('sync')
  , inherits = require('util').inherits
  , EventEmitter = require('events').EventEmitter
  ;

function copy(orig) {
  var n = {};
  if (orig) {
    Object.keys(orig).forEach(function(k) {
      n[k] = orig[k];
    });
  }
  return n;
}

function Cache(file, options) {
  this.options = copy(options);
  this.options.maxAge || (this.options.maxAge = 300);
  if (typeof this.options.gzip === 'undefined') {
    this.options.gzip = true;
  }
  this.file = file;
  this.mime = mime.lookup(this.file);
  this.stat = fs.statSync(this.file);
  this.cacheFile();

  if (this.options.watch) {
    fs.watchFile(file, {persistent: false, interval: this.options.watchInterval || 2000}, this.onChange.bind(this));
  }
}
inherits(Cache, EventEmitter);

Cache.prototype.onChange = function(stat) {
  this.stat = stat;
  this.cacheFile();
};

Cache.prototype.cacheFile = function() {
  this.ready = false;
  this.buf = fs.readFileSync(this.file);
  this.buildHeaders();
  if (this.options.gzip && /^text\//.exec(this.mime)) {
    this.gzip();
  }
  this.ready = true;
  this.emit('ready');
};

Cache.prototype.buildHeaders = function() {
  this.headers = {};
  this.headers['Content-Type'] = this.mime;

  var charset = mime.charsets.lookup(this.file);
  if (charset) {
    this.headers['Content-Type'] += '; charset=' + charset;
  }

  this.headers['Last-Modified'] = this.stat.mtime.toUTCString();
  this.headers['ETag'] = hash.sha1(this.buf.toString());
  this.headers['Content-Length'] = this.stat.size;
  this.headers['Vary'] = 'Accept-Encoding';
  if (this.options.maxAge) {
    this.headers['Cache-Control'] = 'public, max-age: ' + this.options.maxAge;
  }
  this.headers['Connection'] = 'close';
};

Cache.prototype.gzip = function() {
  var self = this;
  sync(function() {
    self.gzipped = gzip.sync(null, self.buf, {});
    self.gzippedLength = self.gzipped.length;
  });
};

Cache.prototype.onReady = function(cb) {
  if (this.ready) {
    cb.call(this);
  }
  else {
    this.once('ready', cb.bind(this));
  }
};

Cache.prototype.stream = function(req, res) {
  this.onReady(function() {
    var bufProp = 'buf', headers = copy(this.headers);

    if (this.gzipped && req.headers['accept-encoding'] && /gzip/i.exec(req.headers['accept-encoding'])) {
      bufProp = 'gzipped';
      headers['Content-Encoding'] = 'gzip';
      headers['Content-Length'] = this.gzippedLength;
    }

    if (req.headers['if-none-match'] === headers['ETag'] || Date.parse(req.headers['if-modified-since']) >= this.stat.mtime) {
      delete headers['Content-Length'];
      delete headers['Content-Encoding'];
      res.writeHead(304, headers);
      res.end();
    }

    headers['Date'] = new Date().toUTCString();
    res.writeHead(200, headers);

    if (req.method === 'HEAD') {
      res.end();
    }
    else {
      res.end(this[bufProp]);
    }
  });
};

module.exports = Cache;
