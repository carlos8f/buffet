var mayonnaise = require('mayonnaise');

module.exports = function (root, options) {
  options || (options = {});
  var specs = [
    {
      cwd: root || options.root,
      globs: '**/*'
    }
  ];
  var mayo = mayonnaise(specs, options);
  var middleware = mayo.middleware('static', options);
  middleware.notFound = function (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Method not allowed\n');
    }
    else {
      if (options.notFoundPath) {
        var cached = mayo.get(options.notFoundPath);
        if (cached) cached.serve({status: 404})(req, res, next);
        else default404();
      }
      else default404();

      function default404 () {
        res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
        res.end('Page not found\n');
        return;
      }
    }
  };
  return middleware;
};
