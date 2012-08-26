var middler = require('middler')()
  , server = require('http').createServer()
  , resolve = require('path').resolve
  , root = resolve(__dirname, '../test/files')

var paperboy = require('paperboy');

middler
  .add(function (req, res, next) {
    paperboy.deliver(root, req, res);
  })
  .attach(server);

server.listen(0);
console.log(server.address().port);