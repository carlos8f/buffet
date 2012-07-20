var fs = require('fs')
  , url = require('url')
  , mime = require('mime')
  , join = require('path').join
  , dive = require('diveSync')
  , path = require('path')
  , Cache = require('./cache')
  ;

var stalwart = module.exports = function(root, options) {
  var cache = {}, parsed = {};

  root = path.resolve(root);

  dive(root, options, function(err, file) {
    if (err) throw err;

    var urlPath = file.substring(root.length);
    cache[urlPath] = new Cache(file, options);
    // Index support
    if (path.basename(urlPath) === 'index.html') {
      cache[path.dirname(urlPath)] = cache[urlPath];
    }
  });

  return function stalwartHandler(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    var urlPath = parsed[req.url] ? parsed[req.url] : url.parse(req.url).pathname;

    // Decode and strip nullbytes for security
    urlPath = decodeURIComponent(urlPath).replace(/\0/g, '');

    parsed[req.url] = urlPath;

    // Don't support paths outside the root
    if (urlPath.indexOf('..') !== -1) {
      return next();
    }

    var cached = cache[urlPath];
    if (!cached) {
      return next();
    }

    cached.stream(req, res);
  };
};