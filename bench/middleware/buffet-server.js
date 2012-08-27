var execFile = require('child_process').execFile

module.exports = function (options, cb) {
  var port = randomPort()
    , buffetRoot = require('path').resolve(__dirname, '../..')
    , buffet = execFile(buffetRoot + '/bin/buffet.js', ['-p', port, '--no-log'], {cwd: options.root})

  buffet.stderr.on('data', function (chunk) {
    if (chunk.toString().match(/listening/)) {
      cb(null, port);
    }
  });
};

function randomPort () {
  return Math.round((Math.random() * 2e4) + 2e4);
}