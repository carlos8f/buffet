var http = require('http')
  , handler = require('./')('test/files')
  , port = 9000
  ;

http.createServer(function(req, res) {
  handler(req, res, function() {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('file not found');
    res.end();
  });
}).listen(port, function() {
  console.log('test server running on port 9000');
});
