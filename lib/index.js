var url = require('url')
  , fs = require('fs')
  , path = require('path')
  , glob = require('glob')
  , watch = require('fs-watch-tree').watchTree
  , copy = require('./copy')
  , File = require('./file')
  , EventEmitter = require('events').EventEmitter
  ;

module.exports = function buffet(root, opts) {
  var cache = {}, parsed = {}, options = copy(opts);
  ['indexes', 'gzip', 'watch', 'poweredBy'].forEach(function(opt) {
    if (typeof options[opt] === 'undefined') {
      options[opt] = true;
    }
  });
  options.maxAge || (options.maxAge = 300);
  root = path.resolve(root);
  options.root = root;
  var ready = false, readyQueue = new EventEmitter;
  readyQueue.setMaxListeners(0);

  if (options.watch) {
    watch(root, {exclude: [/^\./]}, buffetWatcher);

    function buffetWatcher(event) {
      if (event.isDirectory()) return;
      var urlPath = event.name.substring(root.length);
      var filePath = event.name;
      if (event.isModify()) {
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
      else if (event.isDelete()) {
        delete cache[urlPath];
        if (isIndex(urlPath)) {
          delete cache[path.dirname(urlPath)];
        }
      }
    }
  }

  function primeBuffet() {
    glob.sync(root + '/**', {mark: true}).forEach(function(filePath) {
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

  if (options.watch) {
    // Apply the watcher before priming the cache. Since there is no callback
    // notifying when watcher is watching, we wait a small timeout.
    setTimeout(primeBuffet, 100);
  }
  else {
    primeBuffet();
  }

  function isIndex(urlPath) {
    return options.indexes && path.basename(urlPath) === 'index.html';
  }

  function onReady(cb) {
    if (ready) {
      cb();
    }
    else {
      readyQueue.once('ready', cb);
    }
  }

  return function serveBuffet(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
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
        // 404.
        return next();
      }

      cached.serve(req, res);
    });
  };
};