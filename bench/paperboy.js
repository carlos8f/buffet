var utils = require('./lib/utils')

exports.name = 'paperboy';
exports.version = utils.version(exports.name);

exports.middleware = function (options) {
  var paperboy = require('paperboy');
  return function (req, res, next) {
    paperboy.deliver(options.root, req, res);
  };
};