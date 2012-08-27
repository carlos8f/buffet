buffet-benchmarks
=================

Benchmarks vs. competing static middleware

Usage
-----

(you'll need [siege](http://www.joedog.org/siege-home/) installed)

In the buffet root, run:

```bash
$ make bench
```

Or to run a specific benchmark,

```bash
$ node bench <module> [time] [wait]
```

Time defaults to `30` (seconds), and `wait` to `10` (seconds) between tests.

My results
----------

https://gist.github.com/3473500