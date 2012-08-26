var server = require('http').createServer()
  , middler = require('middler')
  , glob = require('glob')
  , async = require('async')
  , root = require('path').resolve(__dirname, '../test/files')
  , getVersion = require('./lib/version')
  , siege = require('./lib/siege')
  , basename = require('path').basename
  , summary = require('./lib/summary')
  , repeat = require('./lib/repeat')
  , time = parseInt(process.argv[2] || 30, 10)
  , wait = parseInt(process.argv[3] || 10, 10)

console.log('\nnode-buffet benchmarks, ' + new Date() + '\n');

server.listen(0, function () {
  var port = server.address().port;

  glob('middleware/*.js', {cwd: __dirname}, function (err, matches) {
    if (err) throw err;

    // randomize order
    matches.sort(function () { return 0.5 - Math.random() });

    var results = {}
      , coolOff = 0

    var tasks = matches.map(function (match) {
      return function (cb) {
        var mod = basename(match, '.js');

        function onErr (err) {
          console.error(err, 'error');
          cb();
        }

        getVersion(mod, function (err, version) {
          if (err) return onErr(err);

          var summaryKey = mod + '@' + version
            , header = summaryKey + '\n' + repeat('-', summaryKey.length)

          console.log(header + '\n');

          function siegeAfterCooloff (port) {
            setTimeout(function () {
              siege(mod, port, time, function (err, proc) {
                if (err) return onErr(err);
                proc.stderr.pipe(process.stdout);
                var output = '';
                proc.stderr.on('data', function (chunk) {
                  output += chunk;
                });
                proc.once('close', function (code) {
                  if (code) return onErr(new Error('siege exited with code ' + code));
                  results[summaryKey] = output;
                  cb();
                });
              });
            }, coolOff); // "cool off" between benchmarks
            coolOff = wait;
          }

          var middleware = require('./' + match)({root: root}, function (err, port) {
            if (err) return onErr(err);
            siegeAfterCooloff(port);
          });

          if (middleware) {
            middler(server)
              .removeAll()
              .add(middleware);

            siegeAfterCooloff(port);
          }
        });
      };
    });

    async.series(tasks, function (err) {
      if (err) throw err;

      console.log(summary(results));
      server.close();
      process.exit();
    });
  });
});