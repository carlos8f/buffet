var middler = require('middler')()
  , server = require('http').createServer()
  , resolve = require('path').resolve
  , root = resolve(__dirname, '../test/files')

var static = require('node-static')
  , fileServer = new(static.Server)(root)

middler
  .add(fileServer.serve.bind(fileServer))
  .attach(server);

server.listen(0);
console.log(server.address().port);