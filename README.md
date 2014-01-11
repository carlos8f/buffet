buffet
======

Performance-oriented static file server

[![build status](https://secure.travis-ci.org/carlos8f/node-buffet.png)](http://travis-ci.org/carlos8f/node-buffet)

Idea
----

Serving static files should be the most efficient thing that a Node.js app can
do. Turns out, runtime syscalls to the filesystem can really hang your page
loads, especially if your filesystem is networked or unreliable in some other way.

Buffet takes a fully-bufferred approach -- all files are fully loaded into
memory when your app boots, so you will never feel the burn of the filesystem.
In practice, this is immensely efficient. So much so that putting
[Varnish](https://www.varnish-cache.org/) in front of your app might even make it
slower! Well, almost (summary from buffet's `make bench`):

```
****************  varnish (4874.64 rps)
***************   buffet-server (4421.13 rps)
*************     buffet (3742.6 rps)
*********         st (2659.29 rps)
*********         node-static (2645.31 rps)
******            send (1646.75 rps)
*****             ecstatic (1302.24 rps)
***               paperboy (625.28 rps)
```

Continuous deployment is also becoming all the rage, and restarting Varnish is
a pain, so consider using Buffet -- your pages will always be fresh and zesty!

Usage
-----

### Middleware

Middleware version (compatible with [connect](http://www.senchalabs.org/connect/),
[union/flatiron](http://flatironjs.org/), [middler](https://npmjs.org/package/middler), etc.)

```javascript
var connect = require('connect')
  , app = connect()
  , buffet = require('buffet')({root: './public'}) // root defaults to ./public

app.use(buffet);
app.use(buffet.notFound);

var server = require('http').createServer(app);
server.listen(3000, function () {
  console.log('test server running on port 3000');
});
```

### Easy built-in server

```bash
$ npm install -g buffet
$ cd /var/www/html && buffet
buffet 0.4.0 listening on port 8080
```

### As a request handler

```javascript
var server = require('http').createServer();
var buffet = require('buffet')(); // root defaults to ./public

server.on('request', function (req, res) {
  buffet(req, res, function () {
    buffet.notFound(req, res);
  });
});

server.listen(3000, function () {
  console.log('test server running on port 3000');
});
```

Options
-------

- `root`: Document root. Can also be passed as the first parameter to `buffet()`.
  (Default: `./public`)
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
- <del>keepAlive</del>: **This option is removed as of `v0.6.1`**. The intention was to
  clean up idle connections, but the implementation was shown to
  [abort active requests](https://github.com/carlos8f/node-buffet/issues/14).
  Please do not use this option!
- `defaultContentType`: If the file does not have an extension, set this to specify the default `Content-Type` sent to the browser. This defaults to `application/octet-stream`.

Running your own benchmark
--------------------------

Type `make bench` in the buffet directory (you'll need
[siege](http://www.joedog.org/siege-home/) installed).

Brought to you by [benchmarx](https://github.com/carlos8f/node-benchmarx).

See [here](https://gist.github.com/3473500) for my results.

- - -

### Developed by [Terra Eclipse](http://www.terraeclipse.com)
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

- - -

### License: MIT

- Copyright (C) 2012 Carlos Rodriguez (http://s8f.org/)
- Copyright (C) 2012 Terra Eclipse, Inc. (http://www.terraeclipse.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.