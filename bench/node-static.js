var utils = require('./lib/utils')

exports.name = 'node-static';
exports.version = utils.version(exports.name);

exports.middleware = function (options) {
  var nodeStatic = require('node-static')
    , fileServer = new(nodeStatic.Server)(options.root)

  return fileServer.serve.bind(fileServer);
};