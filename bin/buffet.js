#!/usr/bin/env node
var argv = require('optimist')
    .alias('h', 'help')
    .default('root', process.cwd())
    .alias('p', 'port')
    .default('p', 8080)
    .alias('l', 'log')
    .default('l', true)
    .alias('v', 'version')
    .alias('t', 'threads')
    .default('t', require('os').cpus().length)
    .argv
  , http = require('http')
  , accesslog = require('accesslog')
  , version = require(require('path').join(__dirname, '../package.json')).version
  ;

if (argv.v) {
  console.log('buffet ' + version);
  process.exit();
}
else if (argv.help) {
  console.log('Usage: buffet '
      + '[--root=dir] [--port=port] [--no-log | --log=file...] [--no-watch]\n'
      + '              [--conf=file...] [--max-age=seconds] [--404=404.html]\n'
      + '              [--no-indexes] [--index=index.html]');
  process.exit();
}

var options;
if (argv.conf) {
  options = require(argv.conf);
}
else {
  var options = {
    root: argv['root'],
    watch: argv['watch'],
    maxAge: argv['max-age'],
    notFoundPath: argv['404'],
    indexes: argv['indexes'],
    index: argv['index']
  };
}
var cluster = require('cluster');

if (cluster.isMaster) {
  for (var i = 0; i < argv.threads; i++) {
    cluster.fork();
  }
  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });
  console.log('buffet ' + version + ' listening on port ' + argv.port);
}
else {
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

  var buffet = require('../')(options.root, options);
  http.createServer(function(req, res) {
    logger(req, res, function() {
      buffet(req, res, buffet.notFound.bind(null, req, res));
    });
  }).listen(argv.port);
}