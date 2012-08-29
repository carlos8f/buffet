var spawn = require('child_process').spawn
  , execFile = require('child_process').execFile
  , buffet
  , varnish

exports.name = 'varnish';

exports.listen = function (options, cb) {
  var buffetPort = randomPort()
    , buffetRoot = require('path').resolve(__dirname, '..')
    , port = randomPort() 

  buffet = execFile(buffetRoot + '/bin/buffet.js', ['-p', buffetPort], {cwd: options.root});
  
  varnish = spawn('varnishd', ['-F', '-n', require('idgen')(), '-s', 'malloc', '-b', '127.0.0.1:' + buffetPort, '-a', '127.0.0.1:' + port]);
  varnish.stderr.on('data', function (chunk) {
    if (chunk.toString().match(/Child starts/)) {
      cb(null, port);
    }
  });
};

exports.close = function () {
  varnish.kill();
  buffet.kill();
};

function randomPort () {
  return Math.round((Math.random() * 2e4) + 2e4);
}