exports.middleware = function (options) {
  return require('ecstatic')(options.root, { cache: 7200 });
};