var url = require('url')
  , fs = require('graceful-fs')
  , path = require('path')
  , copy = require('./copy')
  , dish = require('dish')
  , http = require('http')
  , EventEmitter = require('events').EventEmitter
  , saw = require('saw')

/**
 * format for portable patterns:
 * key => /absolute/cwd => [relative glob, relative glob]
 * i.e. views => /home/carlos8f/projects/gist-blog/views => [*.hbs, **\/*.hbs]
 */
module.exports = function buffet (pattern, options) {
  if (pattern && pattern.constructor === Object) {
    options = pattern;
    pattern = null;
  }
  options || (options = {});
  options = copy(options);

  options.defaultContentType = options.defaultContentType || 'application/octet-stream';
  if (typeof options.maxAge === 'undefined') options.maxAge = 300;
  options.index || (options.index = 'index.html');
  options.notFoundPath || (options.notFoundPath = '/404.html');
  if (options.notFoundPath[0] !== '/') {
    options.notFoundPath = '/' + options.notFoundPath;
  }

  if (Array.isArray(pattern)) {
    pattern = pattern.length < 2 ? pattern[0] : '{' + (pattern.join(',')) + '}';
  }
  else if (!pattern) pattern = './public';

  try {
    var stat = fs.statSync(pattern);
    if (stat && stat.isDirectory()) {
      options.cwd || (options.cwd = pattern);
      pattern = pattern.replace(path.sep, '/');
      pattern = pattern.replace(new RegExp(path.sep + '$', ''), '') + '/**/*';
    }
  }
  catch (e) {
    options.cwd || (options.cwd = process.cwd());
  }

  options.cwd = path.resolve(options.cwd);

  var cache = {}, parsedUrls = {};
  var s = saw(pattern, options)
    .on('error', function (err) {
      // nowhere to pass the error, so...
      throw err;
    })
    .on('all', function (ev, file) {
      if (file.stat.isDirectory()) return;
      // glob filepaths are normalized as /, so we'll do the same here
      var urlPath = file.fullPath.replace(options.cwd, '').replace(/\\/g, '/');
      switch (ev) {
        case 'add':
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
        case 'update':
          if (!cache[urlPath]) cache[urlPath] = dish.file(file.fullPath, options);
          dish.clearCache(file.fullPath);
          break;
        case 'remove':
          dish.clearCache(file.fullPath);
          delete cache[urlPath];
          break;
      }
    })
    .once('ready', function (files) {
      console.log("options.cwd", options.cwd);
      files.forEach(function (file) {
        if (file.stat.isDirectory()) return;
        var urlPath = file.fullPath.replace(options.cwd, '').replace(/\\/g, '/');
        console.log('urlPath', urlPath);
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
      });
    });

  function isIndex(urlPath) {
    return options.indexes && path.basename(urlPath) === options.index;
  }

  var serveBuffet = function serveBuffet(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next && next();
      return;
    }

    var urlPath = parsedUrls[req.url];
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
      parsedUrls[req.url] = urlPath;
    }

    function serveIt () {
      var cached = cache[urlPath];
      if (!cached) {
        // Soft 404.
        next && next();
        return;
      }

      cached(req, res);
    }

    if (s.ready) serveIt();
    else s.once('ready', serveIt);
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
    dish.clearCache();
    cb && cb();
  };
  return serveBuffet;
};
