var server = require('http').createServer();
var buffet = require('buffet')(); // root defaults to ./public

server.on('request', buffet);
server.on('request', buffet.notFound);

server.listen(3000, function () {
  console.log('test server running on port 3000');
});
