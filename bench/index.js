var server = require('http').createServer()
  , middler = require('middler')
  , glob = require('glob')
  , async = require('async')
  , root = require('path').resolve(__dirname, '../test/files')
  , getVersion = require('./lib/version')
  , siege = require('./lib/siege')
  , basename = require('path').basename
  , coolOff = 0

console.log('\nnode-buffet benchmarks, ' + new Date() + '\n');

server.listen(0, function () {
  var port = server.address().port;

  glob('middleware/*.js', {cwd: __dirname}, function (err, matches) {
    if (err) throw err;

    // randomize order
    matches.sort(function () { return 0.5 - Math.random() });

    var tasks = matches.map(function (match) {
      return function (cb) {
        var mod = basename(match, '.js');

        function onErr (err) {
          console.error(err, 'error');
          cb();
        }

        function siegeAfterCooloff (port) {
          setTimeout(function () {
            siege(mod, port, function (err, proc) {
              if (err) return onErr(err);
              proc.stderr.pipe(process.stdout);
              proc.once('close', cb.bind(null, null));
            });
          }, coolOff); // "cool off" between benchmarks
        }

        getVersion(mod, function (err, version) {
          if (err) return onErr(err);

          var header = mod + '@' + version + '\n';
          header += repeat('=', header.length - 1);
          console.log(header + '\n');

          var middleware = require('./' + match)({root: root}, function (err, port) {
            if (err) return onErr(err);
            siegeAfterCooloff(port);
          });

          if (middleware) {
            middler(server).items = [];
            middler(server).add(middleware);
            siegeAfterCooloff(port);
          }

          coolOff = 10000;
        });
      };
    });

    async.series(tasks, function (err) {
      if (err) throw err;
      server.close();
      process.exit();
    });
  });
});

function repeat (c, len) {
  var ret = '';
  while (ret.length < len) ret += c;
  return ret;
}