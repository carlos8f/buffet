var middler = require('middler')()
  , server = require('http').createServer()
  , resolve = require('path').resolve
  , root = resolve(__dirname, '../test/files')

middler
  .add(require('ecstatic')(root))
  .attach(server);

server.listen(0);
console.log(server.address().port);