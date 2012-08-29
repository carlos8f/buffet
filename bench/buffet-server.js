var execFile = require('child_process').execFile
  , utils = require('./lib/utils')
  , buffet

exports.name = 'buffet-server';
exports.version = utils.version(exports.name);

exports.listen = function (options, cb) {
  var port = randomPort()
    , buffetRoot = utils.resolve(__dirname, '..')

  buffet = execFile(buffetRoot + '/bin/buffet.js', ['-p', port, '--no-log', '--no-watch'], {cwd: options.root});
  buffet.stderr.on('data', function (chunk) {
    if (chunk.toString().match(/listening/)) {
      cb(null, port);
    }
  });
};

exports.close = function () {
  buffet.kill();
};

function randomPort () {
  return Math.round((Math.random() * 2e4) + 2e4);
}