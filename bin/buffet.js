#!/usr/bin/env node
var argv = require('optimist')
    .alias('h', 'help')
    .default('root', process.cwd())
    .alias('p', 'port')
    .default('p', 8080)
    .alias('l', 'log')
    .alias('v', 'version')
    .argv
  , http = require('http')
  , accesslog = require('accesslog')
  , buffet = require('../')(argv.root, {watch: argv['watch'], maxAge: argv['max-age'], notFoundPath: argv['404']})
  , version = require(require('path').join(__dirname, '../package.json')).version
  ;

if (argv.v) {
  console.log('buffet ' + version);
  process.exit();
}
else if (argv.help) {
  console.log('Usage: buffet '
      + '[--root=dir] [-p port | --port=port] [--log | --log=file...]\n'
      + '              [--no-watch] [--conf=file...] [--max-age=seconds]');
  process.exit();
}

var logger;
if (argv.log) {
  var loggerOptions = {};
  if (typeof argv.log === 'string') {
    loggerOptions.path = argv.log;
  }
  logger = accesslog(loggerOptions);
}
else {
  // dummy logger
  logger = function(req, res, next) {
    next();
  };
}

http.createServer(function(req, res) {
  logger(req, res, function() {
    buffet(req, res, buffet.notFound.bind(null, req, res));
  });
}).listen(argv.port, function() {
  console.log('buffet ' + version + ' listening on port ' + argv.port);
});
