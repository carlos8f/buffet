var url = require('url')
  , fs = require('fs')
  , path = require('path')
  , glob = require('glob')
  , watchr = require('watchr')
  , copy = require('./copy')
  , File = require('./file')
  , http = require('http')
  , EventEmitter = require('events').EventEmitter
  ;

module.exports = function buffet(root, opts) {
  var cache = {}, parsed = {}, options = copy(opts);
  ['indexes', 'gzip', 'watch', 'poweredBy'].forEach(function(opt) {
    if (typeof options[opt] === 'undefined') {
      options[opt] = true;
    }
  });
  if (typeof options.keepAlive === 'undefined') {
    options.keepAlive = 5000;
  }
  options.maxAge || (options.maxAge = 300);
  options.index || (options.index = 'index.html');
  options.notFoundPath || (options.notFoundPath = '/404.html');
  if (options.notFoundPath[0] !== '/') {
    options.notFoundPath = '/' + options.notFoundPath;
  }
  root = path.resolve(root);
  options.root = root;
  var ready = false, readyQueue = new EventEmitter;
  readyQueue.setMaxListeners(0);

  if (options.watch) {
    watchr.watch({
      path: root,
      listener: buffetWatcher,
      ignoreHiddenFiles: true,
      ignorePatterns: true
    });

    function buffetWatcher(event, filePath, stat, prevStat) {
      var urlPath = filePath.substring(root.length);
      if (event === 'new' || event === 'change') {
        if (stat.isDirectory()) {
          if (event === 'new') {
            serveBuffet.rebuild(filePath);
          }
        }
        else {
          try {
            cache[urlPath] = new File(filePath, options);
            // Index support
            if (isIndex(urlPath)) {
              cache[path.dirname(urlPath)] = cache[urlPath];
            }
          }
          catch (e) {
            delete cache[urlPath];
          }
        }
      }
      else if (event === 'unlink') {
        delete cache[urlPath];
        if (isIndex(urlPath)) {
          delete cache[path.dirname(urlPath)];
        }
      }
    }
  }

  function primeBuffet(rootPath) {
    rootPath = rootPath || root;
    glob(rootPath + '/**', {mark: true}, function(err, matches) {
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
            cache[urlPath] = new File(filePath, options);
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

  if (options.watch) {
    // Apply the watcher before priming the cache. Since there is no callback
    // notifying when watcher is watching, we wait a small timeout.
    setTimeout(primeBuffet, 100);
  }
  else {
    primeBuffet();
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
      urlPath = decodeURIComponent(urlPath).replace(/\0/g, '');
      parsed[req.url] = urlPath;
    }

    onReady(function onCacheReady() {
      var cached = cache[urlPath];
      if (!cached) {
        // Soft 404.
        next && next();
        return;
      }

      cached.serve(req, res);
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
        cached.serve(req, res, 404);
      }
    }
  };
  serveBuffet.rebuild = function(rootPath, cb) {
    if (typeof rootPath === 'function') {
      cb = rootPath;
      rootPath = null;
    }
    onReady(function() {
      ready = false;
      if (rootPath) {
        var rootUrlPath = rootPath.substring(root.length);
        Object.keys(cache).forEach(function(urlPath) {
          if (urlPath.indexOf(rootUrlPath) === 0) {
            delete cache[urlPath];
          }
        });
      }
      else {
        cache = {};
      }
      primeBuffet(rootPath);
      onReady(function() {
        if (cb) cb();
      });
    });
  };
  return serveBuffet;
};
