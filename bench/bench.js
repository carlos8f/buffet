#!/usr/bin/env node

var spawn = require('child_process').spawn
  , test = process.argv[2]
  , fs = require('fs')
  , idgen = require('idgen')

var testServer = spawn('node', [require('path').resolve(__dirname, './' + test)]);
testServer.stdout.once('data', function (chunk) {
  var port = parseInt(chunk, 10)
    , id = idgen()
    , baseUrl = 'http://localhost:' + port
    , logFilePath = '/tmp/buffet-benchmark-' + id + '.log'
    , args = ['-b', '-t', '30s', '--log=' + logFilePath]

  var urls = [
    '/',
    '/hello.txt',
    '/folder/Alice-white-rabbit.jpg'
  ].map(function (path) {
    return baseUrl + path;
  });

  var urlFilePath = '/tmp/buffet-benchmark-' + id + '.txt';

  fs.writeFileSync(urlFilePath, urls.join('\n'));
  args = args.concat(['-f', urlFilePath]);

  var siege = spawn('siege', args);

  siege.stderr.pipe(process.stderr);

  siege.on('close', function () {
    fs.unlinkSync(urlFilePath);
    testServer.kill();
  });
});
