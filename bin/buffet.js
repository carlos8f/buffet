#!/usr/bin/env node
var version = require(require('path').join(__dirname, '../package.json')).version

var argv = require('optimist')
    .alias('h', 'help')
    .alias('p', 'port')
    .default('p', 8080)
    .alias('l', 'log')
    .default('l', true)
    .alias('v', 'version')
    .alias('t', 'threads')
    .default('t', require('os').cpus().length)
    .argv

if (argv.v) {
  console.error('buffet ' + version);
  process.exit();
}
else if (argv.help) {
  console.error('Usage: buffet '
      + '[--root=dir] [--port=port] [--no-log | --log=file...] [--no-watch]\n'
      + '              [--conf=file...] [--max-age=seconds] [--404=404.html]\n'
      + '              [--no-indexes] [--index=index.html] [--keep-alive=ms] [root]');
  process.exit();
}

var options = {
  root: argv['root'] || argv._[0] || process.cwd(),
  watch: argv['watch'],
  maxAge: argv['max-age'],
  notFoundPath: argv['404'],
  indexes: argv['indexes'],
  index: argv['index'],
  keepAlive: argv['keep-alive'],
  threads: argv['threads'],
  port: argv['port'],
  log: argv['log']
};
if (argv.conf) {
  var conf = require(argv.conf);
  Object.keys(conf).forEach(function (k) {
    options[k] = conf[k];
  });
}

var cluster = require('cluster')
  , workerCount = 0

cluster.setupMaster({
  exec: require('path').resolve(__dirname, '../lib/worker.js')
});

// Auto-respawn
cluster.on('exit', function (worker, code, signal) {
  cluster.fork();
});

for (var i = 0; i < options.threads; i++) {
  var worker = cluster.fork();
  worker.on('message', function (message) {
    if (message.cmd === 'BUFFET_UP') {
      workerCount++;
      if (workerCount === options.threads) {
        console.error('buffet ' + version + ' listening on port ' + options.port);
      }
    }
  });
  worker.send({cmd: 'BUFFET_OPTIONS', options: options});
}