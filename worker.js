process.on('message', function (message) {
  if (message.cmd === 'BUFFET_OPTIONS') {
    start(message.options);
  }
});

function start (options) {
  var server = require('http').createServer()
    , middler = require('middler')(server)

  // Add the logger if needed
  if (options.log) {
    middler.add(require('accesslog')({path: typeof options.log === 'string' ? options.log : null}));
  }

  // Add buffet
  var buffet = require('./')(options.root, options);
  middler
    .add(buffet)
    .add(buffet.notFound);

  // Send status back to cluster master
  server.listen(options.port, function () {
    process.send({cmd: 'BUFFET_UP', port: this.address().port});
  });
}