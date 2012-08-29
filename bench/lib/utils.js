exports.resolve = require('path').resolve

exports.version = function (name) {
  if (name.match(/^buffet/)) {
    return require(exports.resolve(__dirname, '../../package')).version;
  }
  
  return require(exports.resolve(__dirname, '../package')).dependencies[name];
};