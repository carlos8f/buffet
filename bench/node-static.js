exports.middleware = function (options) {
  var nodeStatic = require('node-static')
    , fileServer = new(nodeStatic.Server)(options.root, { cache: 7200 })

  return fileServer.serve.bind(fileServer);
};