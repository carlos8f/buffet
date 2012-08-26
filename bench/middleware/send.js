var send = require('send');

module.exports = function (options, cb) {
  return function (req, res, next) {
    send(req, req.url)
      .root(options.root)
      .pipe(res);
  };
};