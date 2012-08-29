var utils = require('./lib/utils')

exports.name = 'buffet-server';
exports.version = utils.version(exports.name);

exports.middleware = function (options, cb) {
  var send = require('send');
  return function (req, res, next) {
    send(req, req.url)
      .root(options.root)
      .pipe(res);
  };
};