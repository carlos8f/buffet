var url = require('url')
  , fs = require('fs')
  , path = require('path')
  , glob = require('glob')
  , copy = require('./copy')
  , dish = require('dish')
  , http = require('http')
  , EventEmitter = require('events').EventEmitter
  , saw = require('saw')

module.exports = function buffet(root, opts) {
  if (typeof root === 'object') {
    opts = root;
    root = opts.root;
  }
  var cache = {}, parsed = {}, options = copy(opts);
  ['indexes', 'gzip', 'watch', 'poweredBy'].forEach(function(opt) {
    if (typeof options[opt] === 'undefined') {
      options[opt] = true;
    }
  });
  options.defaultContentType = options.defaultContentType || 'application/octet-stream';
  options.maxAge || (options.maxAge = 300);
  options.index || (options.index = 'index.html');
  options.notFoundPath || (options.notFoundPath = '/404.html');
  if (options.notFoundPath[0] !== '/') {
    options.notFoundPath = '/' + options.notFoundPath;
  }
  root || (root = options.root) || (root = './public');
  root = fs.realpathSync(path.resolve(root));
  var ready = false, readyQueue = new EventEmitter;
  readyQueue.setMaxListeners(0);

  if (options.watch) {
    var watcher = saw(root);
    watcher.on('error', function (err) {
      // nowhere to pass the error, so...
      throw err;
    });
    watcher.on('all', function (ev, file) {
      if (file.stat.isDirectory() || file.name.match(/^\./)) return;
      var urlPath = file.fullPath.replace(root, '');
      switch (ev) {
        case 'add':
        case 'update':
          try {
            cache[urlPath] = dish.file(file.fullPath, options);
            // Index support
            if (isIndex(urlPath)) {
              cache[path.dirname(urlPath)] = cache[urlPath];
            }
          }
          catch (e) {
            delete cache[urlPath];
          }
          break;
        case 'remove':
          delete cache[urlPath];
          if (isIndex(urlPath)) {
            delete cache[path.dirname(urlPath)];
          }
          break;
      }

    });
    watcher.once('ready', primeBuffet);
  }
  else {
    primeBuffet();
  }

  function primeBuffet() {
    glob(root + '/**', {mark: true}, function(err, matches) {
      if (err) {
        console.error(err);
        ready = true;
        readyQueue.emit('ready');
      }
      else {
        matches.forEach(function(filePath) {
          if (/\/$/.exec(filePath)) return;
          var urlPath = filePath.substring(root.length);
          try {
            cache[urlPath] = dish.file(filePath, options);
            // Index support
            if (isIndex(urlPath)) {
              cache[path.dirname(urlPath)] = cache[urlPath];
            }
          }
          catch (e) {
            delete cache[urlPath];
          }
        });
        ready = true;
        readyQueue.emit('ready');
      }
    });
  }

  function isIndex(urlPath) {
    return options.indexes && path.basename(urlPath) === options.index;
  }

  function onReady(cb) {
    if (ready) {
      cb();
    }
    else {
      readyQueue.once('ready', cb);
    }
  }

  var serveBuffet = function serveBuffet(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next && next();
      return;
    }

    var urlPath = parsed[req.url];
    if (!urlPath) {
      urlPath = url.parse(req.url).pathname;
      // Decode and strip nullbytes for security
      try {
        urlPath = decodeURIComponent(urlPath).replace(/\0/g, '');
      }
      catch (err) {
        if (err.message === 'URI malformed') {
          res.writeHead(400);
          return res.end();
        }
        return next(err);
      }
      parsed[req.url] = urlPath;
    }

    onReady(function onCacheReady() {
      var cached = cache[urlPath];
      if (!cached) {
        // Soft 404.
        next && next();
        return;
      }

      cached(req, res);
    });
  };
  serveBuffet.notFound = function(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Method not allowed\n');
    }
    else {
      var cached = cache[options.notFoundPath];
      if (!cached) {
        res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
        res.end('Page not found\n');
      }
      else {
        cached(req, res, 404);
      }
    }
  };
  serveBuffet.rebuild = function(cb) {
    onReady(function() {
      ready = false;
      cache = {};
      primeBuffet();
      if (cb) onReady(cb);
    });
  };
  return serveBuffet;
};
