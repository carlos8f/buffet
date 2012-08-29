var utils = require('./lib/utils')

exports.name = 'ecstatic';
exports.version = utils.version(exports.name);

exports.middleware = function (options) {
  return require('ecstatic')(options.root);
};