var connect = require('connect')
  , app = connect()
  , buffet = require('buffet')() // root defaults to ./public

app.use(buffet);
app.use(buffet.notFound);

var server = require('http').createServer(app);
server.listen(3000, function () {
  console.log('test server running on port 3000');
});
