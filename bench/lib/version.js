var pkgInfo = require('../package')
  , exec = require('child_process').exec

module.exports = function (mod, cb) {
  var modVersion = pkgInfo.dependencies[mod];
  if (modVersion) {
    cb(null, modVersion);
  }
  else if (mod.match(/^buffet/)) {
    cb(null, require('../../package').version);
  }
  else if (mod === 'varnish') {
    exec('varnishd -V', function (err, stdout, stderr) {
      if (err) return cb(err);
      var match = stderr.match(/varnish\-([\d\.]+)/);
      if (!match) {
        cb(new Error('could not parse varnishd version!'));
      }
      else {
        cb(null, match[1]);
      }
    });
  }
  else {
    cb(new Error('module not found in dependencies: ' + mod));
  }
};