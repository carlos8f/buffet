#!/usr/bin/env node
var argv = require('optimist')
    .usage('Usage: $0 [-p port] [--log | --log=file...] [--no-watch] [--conf=file...]')
    .alias('p', 'port')
    .default('p', 8080)
    .alias('l', 'log')
    .alias('v', 'version')
    .argv
  , http = require('http')
  ;

if (argv.v) {
  console.log(require(require('path').join(__dirname, '../package.json')).version);
  process.exit();
}

var accesslog = require('accesslog');
