var spawn = require('child_process').spawn
  , idgen = require('idgen')
  , fs = require('fs')
  , glob = require('glob')
  , buffetRoot = require('path').resolve(__dirname, '../..')

module.exports = function (test, port, cb) {
  var id = test + '-' + idgen()
    , prefix = '/tmp/buffet-benchmark-' + id
    , logFilePath = prefix + '.log'
    , urlFilePath = prefix + '-urls.txt'
    , baseUrl = 'http://127.0.0.1:' + port + '/'
    , args = ['-b', '-t', '30s', '--log=' + logFilePath, '-f', urlFilePath];

  glob('**', {cwd: buffetRoot + '/test/files'}, function (err, matches) {
    var urls = matches.filter(function (match) {
      if (match === 'folder') return false;
      return true;
    }).map(function (path) {
      return baseUrl + path;
    });

    fs.writeFile(urlFilePath, urls.join('\n'), function (err) {
      if (err) return cb(err);
      var siege = spawn('siege', args);
      siege.once('close', fs.unlink.bind(fs, urlFilePath));
      cb(null, siege);
    });
  });
};