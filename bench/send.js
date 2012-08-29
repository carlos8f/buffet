exports.middleware = function (options, cb) {
  var send = require('send');
  return function (req, res, next) {
    send(req, req.url)
      .root(options.root)
      .pipe(res);
  };
};