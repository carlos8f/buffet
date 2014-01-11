#!/usr/bin/env node
var program = require('commander')
  , resolve = require('path').resolve
  , version = require(resolve(__dirname, '../package.json')).version

program
  .version(version)
  .usage('[options] [root]')
  .option('-r, --root <path>', 'path to webroot (default: cwd)')
  .option('-p, --port <port>', 'specify the port (default: 8080)', Number, 8080)
  .option('-t, --threads <count>', 'number of threads to use (default: CPU count)', Number, require('os').cpus().length)
  .option('--no-log', 'disable logging')
  .option('--logFile <path>', 'log requests to a file')
  .option('--no-watch', "don't watch for file changes")
  .option('--maxAge <seconds>', 'value for max-age Cache-Control header (default: 300)', Number, 300)
  .option('--notFoundPath <path>', 'path of file to serve on 404 (default: /404.html)', '/404.html')
  .option('--no-indexes', "don't serve index file when a directory is requested")
  .option('--index <file>', 'name of index file to look for (default: index.html)', 'index.html')
  .option('--defaultContentType <type>', 'default content type (default: application/octet-stream)')
  .option('--conf <path>', 'path to JSON file to load options from')
  .parse(process.argv);

if (program.conf) {
  var conf = require(program.conf);
  Object.keys(conf).forEach(function (k) {
    program[k] = conf[k];
  });
}

program.root = resolve(program.root || program.args[0] || '.');

if (program.logFile) {
  program.log = program.logFile;
}

// Reduce commander's output to a regular object.
var keys = Object.keys(program).filter(function (k) {
  return !k.match(/^(commands|args|name|options|rawArgs|Command|Option)$|_/);
}), options = {};
keys.forEach(function (k) {
  options[k] = program[k];
});

var cluster = require('cluster')
  , workerCount = 0

cluster.setupMaster({
  exec: require('path').resolve(__dirname, '../lib/worker.js')
});

function fork () {
  var worker = cluster.fork();
  worker.send({cmd: 'BUFFET_OPTIONS', options: options});
  return worker;
}

// Auto-respawn
cluster.on('exit', function (worker, code, signal) {
  fork();
});

for (var i = 0; i < options.threads; i++) {
  var worker = fork();
  worker.on('message', function (message) {
    if (message.cmd === 'BUFFET_UP') {
      workerCount++;
      if (workerCount === options.threads) {
        console.error('buffet ' + version + ' listening on port ' + options.port);
      }
    }
  });
}