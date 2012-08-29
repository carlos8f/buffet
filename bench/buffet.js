exports.version = require(require('path').resolve(__dirname, '../package')).version;

exports.middleware = function (options) {
  return require('../')(options.root);
};