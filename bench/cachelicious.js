exports.version = 'master';

exports.middleware = function (options) {
  return require('cachelicious').connect(options.root, {maxCacheSize: 20971520});
};