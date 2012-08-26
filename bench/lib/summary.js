var repeat = require('./repeat')

module.exports = function (results) {
  var items = []
    , high = 0
    , low = 1e5

  Object.keys(results).forEach(function (k) {
    var output = results[k];
    var item = {};
    item.mod = k;
    item.rps = parseFloat(output.match(/([\d\.]+) trans\/sec/)[1]);
    items.push(item);
    high = Math.max(item.rps, high);
    low = Math.min(item.rps, low);
  });

  var variance = high - low
    , star = variance / 5

  items.sort(function (a, b) {
    if (a.rps < b.rps) return 1;
    if (a.rps > b.rps) return -1;
    return 0;
  });

  return 'SUMMARY\n-------\n\n' + items.reduce(function (prev, item, idx, arr) {
    var stars = Math.min(5, Math.max(1, Math.round(item.rps / star)));

    return prev + repeat('*', stars) + repeat(' ', 5 - stars + 3) + ' ' + item.mod + ' (' + item.rps + ' rps)\n';
  }, '');
};