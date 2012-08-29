exports.middleware = function (options) {
  var paperboy = require('paperboy');
  return function (req, res, next) {
    paperboy.deliver(options.root, req, res);
  };
};