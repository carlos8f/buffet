var server = require('http').createServer();
var buffet = require('../')(); // root defaults to ./public

server.on('request', buffet);

server.listen(3000, function () {
  console.log('test server running on port 3000');
});
