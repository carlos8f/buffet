buffet
------

Performance-oriented static file server

Idea
====

Buffet was borne out of frustration. Serving static files should be the most
efficient thing that a Node.js app can do. Turns out, runtime syscalls to the
filesystem can really hang your page loads, especially if you're getting that
humongous burst of traffic you've been dreaming of, and your filesystem is
networked or unreliable in some other way.

Buffet takes a fully-bufferred approach (hence the name, hehe) -- all files are
fully loaded into memory when your app boots, so you will never feel the burn of
the filesystem. In practice, this is immensely efficient. So much so that putting
[Varnish](https://varnish-cache.org/) in front of your app might even make it
slower!

Continuous deployment is also becoming all the rage, and restarting Varnish is
a pain, so consider using Buffet instead, so your pages are always fresh and
zesty.

Usage
=====

Easy built-in server:

```bash
$ npm install -g buffet
$ cd /var/www/html
$ buffet
buffet 0.2.3 listening on port 8080
```

Middleware version (compatible with [connect](http://www.senchalabs.org/connect/),
[union/flatiron](http://flatironjs.org/), etc.

```javascript
var buffetMiddlware = buffet(root, {options...});
// also available to serve 404 pages:
buffetMiddleware.notFound(req, res);
```

Options
=======

- `indexes`: True to look for `options.index` and serve it for directory requests.
  (Default: true)
- `index`: Name of index file to look for. (Default: `index.html`)
- `gzip`: True to enable gzip when clients can accept it. (Default: `true`)
- `watch`: True to auto-update the buffer when files change. (Default: `true`)
- `poweredBy`: True to add the `X-Powered-By` header. (Default: `true`)
- `maxAge`: Number of max-age seconds to set `Cache-Control` header. Set to
  `false` or `0` to disable. (Default: `300`)
- `notFoundPath`: Path to be rendered on `buffetMiddleware.notFound`. (Default:
  `/404.html`)

Example
=======

```javascript
var buffet = require('buffet')('/var/www/html', {maxAge: 86400})
  , http = require('http')
  , port = 9000
  ;

http.createServer(function(req, res) {
  buffet(req, res, buffet.notFound.bind(null, req, res));
}).listen(port, function() {
  console.log('test server running on port 9000');
});
```

License
=======

MIT