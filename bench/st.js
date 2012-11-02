exports.middleware = function (options) {
  return require('st')({
    path: options.root,
    url: '/',

    cache: {
      fd: {
        max: 1000, // number of fd's to hang on to
        maxAge: 1000*60*60, // amount of ms before fd's expire
      },

      stat: {
        max: 5000, // number of stat objects to hang on to
        maxAge: 1000 * 60, // number of ms that stats are good for
      },

      content: {
        max: 1024*1024*64, // how much memory to use on caching contents
        maxAge: 1000 * 60 * 10, // how long to cache contents for
      }
    }
  });
};