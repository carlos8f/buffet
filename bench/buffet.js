var utils = require('./lib/utils')

exports.name = 'buffet';
exports.version = utils.version(exports.name);

exports.middleware = function (options) {
  return require('../')(options.root);
};