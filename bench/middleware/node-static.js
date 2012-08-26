module.exports = function (options, cb) {
  var nodeStatic = require('node-static')
    , fileServer = new(nodeStatic.Server)(options.root)

  return fileServer.serve.bind(fileServer);
};