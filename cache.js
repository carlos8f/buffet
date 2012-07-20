var fs = require('fs')
  , mime = require('mime')
  , hash = require('node_hash')
  , gzip = require('./gzip').gzip
  , sync = require('sync')
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
  this.file = file;
  this.stats = fs.statSync(this.file);
  this.mime = mime.lookup(this.file);
  this.buf = fs.readFileSync(file);

  if (/^text\//.exec(this.mime)) {
    this.gzip();
  }

  this.buildHeaders();
}

Cache.prototype.buildHeaders = function() {
  this.headers = {};
  this.headers['Content-Type'] = this.mime;

  var charset = mime.charsets.lookup(this.file);
  if (charset) {
    this.headers['Content-Type'] += '; charset=' + charset;
  }

  this.headers['Last-Modified'] = this.stats.mtime.toUTCString();
  this.headers['ETag'] = hash.sha1(this.buf.toString());
  this.headers['Content-Length'] = this.stats.size;
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

Cache.prototype.stream = function(req, res) {
  var bufProp = 'buf', headers = copy(this.headers);

  if (this.gzipped && req.headers['accept-encoding'] && /gzip/i.exec(req.headers['accept-encoding'])) {
    bufProp = 'gzipped';
    headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = this.gzippedLength;
  }

  if (req.headers['if-none-match'] === headers['ETag'] || Date.parse(req.headers['if-modified-since']) >= this.stats.mtime) {
    delete headers['Content-Length'];
    delete headers['Content-Encoding'];
    res.writeHead(304, headers);
    res.end();
  }

  res.writeHead(200, headers);

  if (req.method === 'HEAD') {
    res.end();
  }
  else {
    headers['Date'] = new Date().toUTCString();
    res.end(this[bufProp]);
  }
};

module.exports = Cache;
