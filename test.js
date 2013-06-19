require('gaze')('**/*', {cwd: '/tmp/test'}, function (err, watcher) {
  if (err) throw err;
  this.on('all', console.log);
  this.on('added', function (filepath) {
    if (filepath.slice(-1) === '/') {
      watcher.add(filepath + '**/*', function () {})
      console.log('added dir', filepath);
    }
  })
});
process.openStdin();
