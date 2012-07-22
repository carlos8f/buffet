var fs = require('fs')
  , mime = require('mime')
  , hash = require('node_hash')
  , gzip = require('gzip-buffer').gzip
  , copy = require('./copy')
  , inherits = require('util').inherits
  , EventEmitter = require('events').EventEmitter
  , pkgInfo = require('../package.json')
  , poweredBy = pkgInfo.name + ' ' + pkgInfo.version
  , gzippable = require('./gzippable')
  ;

function File(file, options) {
  EventEmitter.call(this);
  this.setMaxListeners(0);
  this.options = copy(options);
  this.file = file;
  this.mime = mime.lookup(this.file);
  this.cache();
}
inherits(File, EventEmitter);

File.prototype.cache = function(stat) {
  this.ready = false;
  this.stat = fs.statSync(this.file);
  var self = this;
  fs.readFile(this.file, function(err, buf) {
    if (err) {
      return self.emit('error', err);
    }
    self.buf = buf;
    self.buildHeaders();
    self.gzip(function() {
      self.ready = true;
      self.emit('ready');
    });
  });
};

File.prototype.buildHeaders = function() {
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
  if (this.options['poweredBy']) {
    this.headers['X-Powered-By'] = poweredBy;
  }
  if (this.options['keepAlive']) {
    this.headers['Connection'] = 'keep-alive';
  }
  else {
    this.headers['Connection'] = 'close';
  }
};

File.prototype.gzip = function(cb) {
  var self = this;
  if (this.options.gzip && gzippable(this.mime)) {
    gzip(this.buf, function(data) {
      self.gzipped = data;
      self.gzippedLength = data.length;
      cb && cb();
    });
  }
  else {
    cb && cb();
  }
};

File.prototype.onReady = function(cb) {
  if (this.ready) {
    cb.call(this);
  }
  else {
    this.once('ready', cb.bind(this));
  }
};

File.prototype.serve = function(req, res, status) {
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
      return res.end();
    }
    else {
      headers['Date'] = new Date().toUTCString()
      res.writeHead(status || 200, headers);
    }

    if (req.method === 'HEAD') {
      res.end();
    }
    else {
      res.end(this[bufProp]);
    }
  });
};

module.exports = File;
