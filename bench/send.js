var middler = require('middler')()
  , server = require('http').createServer()
  , resolve = require('path').resolve
  , root = resolve(__dirname, '../test/files')

var send = require('send');

middler
  .add(function (req, res, next) {
    send(req, req.url)
      .root(root)
      .pipe(res);
  })
  .attach(server);

server.listen(0);
console.log(server.address().port);