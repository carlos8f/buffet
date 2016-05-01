var Mayonnaise = require('mayonnaise').Mayonnaise
  , inherits = require('util').inherits
  , dish = require('dish')
  , path = require('path')
  , fs = require('fs')
  , parseUrl = require('url').parse
  , parsedUrls = {}

function Buffet (specs, options) {
  if (toString.call(specs) === '[object Object]') {
    options = specs;
    specs = null;
  }
  if (!specs) specs = 'public/**/*';
  Mayonnaise.call(this, specs, options);
  this.on('all', function (op, file) {
    switch (op) {
      case 'add': case 'update': case 'cleanup':
        dish.clearCache(file.fullPath);
        break;
    }
  });
}
inherits(Buffet, Mayonnaise);

Buffet.prototype.middleware = function (options) {
  var self = this;
  options || (options = {});
  options.defaultContentType = options.defaultContentType || 'application/octet-stream';
  if (typeof options.maxAge === 'undefined') options.maxAge = 300;
  options.index || (options.index = 'index.html');
  options.notFoundPath || (options.notFoundPath = '/404.html');
  if (options.notFoundPath[0] !== '/') {
    options.notFoundPath = '/' + options.notFoundPath;
  }

  var mw = function (req, res, next) {
    if (!next) next = function () {
      mw.notFound(req, res);
    };
    if (req.method.match(/^get|head$/i)) {
      // check for static file
      if (self.ready) checkCache();
      else {
        self.once('ready', checkCache);
      }
    }
    else next();

    function checkCache () {
      var urlPath = parsedUrls[req.url];
      if (!urlPath) {
        urlPath = parseUrl(req.url).pathname;
        // Decode and strip nullbytes for security
        try {
          urlPath = decodeURIComponent(urlPath).replace(/\0/g, '');
        }
        catch (err) {
          return next();
        }
        parsedUrls[req.url] = urlPath;
      }
      var file = self.get(urlPath);
      if (file && file.stat.isFile()) return dish.file(file.fullPath, options)(req, res, next);
      if (options.index) {
        if (urlPath !== '/') urlPath += '/';
        urlPath += options.index;
        file = self.get(urlPath);
        if (file) return dish.file(file.fullPath, options)(req, res, next);
      }
      next();
    }
  };
  mw.notFound = function (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Method not allowed\n');
    }
    else {
      if (options.notFoundPath) {
        var cached = self.get(options.notFoundPath);
        if (cached) dish.file(cached.fullPath, {status: 404})(req, res, next);
        else default404();
      }
      else default404();

      function default404 () {
        res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
        res.end('Page not found\n');
        return;
      }
    }
  };
  return mw;
};

module.exports = function (root, options) {
  if (root && root.constructor === Object) {
    options = root;
    root = options.root;
  }
  if (!root) {
    try {
      var stat = fs.statSync('public');
      root = path.resolve('public');
    }
    catch (e) {}
  }
  return new Buffet([{globs: '**/*', cwd: root}], options).middleware(options);
};

module.exports.Buffet = Buffet;
