buffet
======

Static file server with in-memory cache

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
// (non-static routes here)
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
```

### As a request handler

```javascript
var server = require('http').createServer();
var buffet = require('buffet')(); // root defaults to ./public

server.on('request', buffet);

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
- `watch`: True to auto-update the buffer when files change. (Default: `true`)
- `notFoundPath`: Path to be rendered on `buffetMiddleware.notFound`. (Default:
  `/404.html`)
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

- Copyright (C) 2014 Carlos Rodriguez (http://s8f.org/)
- Copyright (C) 2014 Terra Eclipse, Inc. (http://www.terraeclipse.com/)

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