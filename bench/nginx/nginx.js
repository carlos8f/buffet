var exec = require('child_process').exec
  , join = require('path').join

exports.name = 'nginx';
exports.version = '1.2.4';

exports.listen = function (options, cb) {
  exec('nginx', ['-c', join(__dirname, 'nginx', 'nginx.conf')]);
  setTimeout(function () {
    cb(null, 8080);
  }, 500);
};

exports.close = function () {
  exec('nginx', ['-s', 'quit']);
};