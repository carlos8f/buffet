var url = require('url')
  , fs = require('fs')
  , dive = require('diveSync')
  , path = require('path')
  , copy = require('./copy')
  , File = require('./file')
  ;

module.exports = function buffet(root, opts) {
  var cache = {}, parsed = {}, options = copy(opts);
  ['indexes', 'gzip', 'watch'].forEach(function(opt) {
    if (typeof options[opt] === 'undefined') {
      options[opt] = true;
    }
  });
  options.maxAge || (options.maxAge = 300);
  root = path.resolve(root);
  options.root = root;

  dive(root, options, function primeBuffet(err, filePath) {
    if (err) throw err;

    var urlPath = filePath.substring(root.length);
    cache[urlPath] = new File(filePath, options);
    // Index support
    if (isIndex(urlPath)) {
      cache[path.dirname(urlPath)] = cache[urlPath];
    }
  });

  if (options.watch) {
    fs.watch(root, {persistent: false}, function buffetWatcher(event, filename) {
      var urlPath = '/' + filename;
      var filePath = path.join(root, filename);
      fs.stat(filePath, function(err, stat) {
        if (!stat) {
          // File no longer exists
          delete cache[urlPath];
          if (isIndex(urlPath)) {
            delete cache[path.dirname(urlPath)];
          }
        }
        else if (stat.isFile()) {
          if (cache[urlPath]) {
            // Update the cache
            cache[urlPath].cache(stat);
          }
          else {
            cache[urlPath] = new File(filePath, options);
            if (isIndex(urlPath)) {
              cache[path.dirname(urlPath)] = cache[urlPath];
            }
          }
        }
      });
    });
  }

  function isIndex(urlPath) {
    return options.indexes && path.basename(urlPath) === 'index.html';
  }

  return function serveBuffet(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    var urlPath = parsed[req.url] ? parsed[req.url] : url.parse(req.url).pathname;

    // Decode and strip nullbytes for security
    urlPath = decodeURIComponent(urlPath).replace(/\0/g, '');

    parsed[req.url] = urlPath;

    var cached = cache[urlPath];
    if (!cached) {
      return next();
    }

    cached.serve(req, res);
  };
};