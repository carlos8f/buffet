var Mayonnaise = require('mayonnaise').Mayonnaise
  , inherits = require('util').inherits
  , dish = require('dish')
  , parseUrl = require('url').parse
  , parsedUrls = {}

function Buffet (specs, options) {
  if (specs.constructor === Object) {
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
    if (req.method.match(/^get|head$/i)) {
      // check for static file
      if (self.ready) checkCache();
      else {
        self.once('ready', checkCache);
      }
    }
    else next && next();

    function checkCache () {
      var urlPath = parsedUrls[req.url];
      if (!urlPath) {
        urlPath = parseUrl(req.url).pathname;
        // Decode and strip nullbytes for security
        try {
          urlPath = decodeURIComponent(urlPath).replace(/\0/g, '');
        }
        catch (err) {
          if (err.message === 'URI malformed') {
            res.writeHead(400);
            return res.end();
          }
          if (!next) throw err;
          return next(err);
        }
        parsedUrls[req.url] = urlPath;
      }
      var file = self.get(urlPath);
      if (file && file.stat.isFile()) return dish.file(file.fullPath, options)(req, res, next);
      if (options.index) {
        if (urlPath !== '/') urlPath += '/';
        urlPath += options.index;
        file = self.get(urlPath);
        if (file) return file.serve(options)(req, res, next);
      }
      next && next();
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

module.exports = function (specs, options) {
  return new Buffet(specs, options).middleware(options);
};

module.exports.Buffet = Buffet;
