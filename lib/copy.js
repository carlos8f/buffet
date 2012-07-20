module.exports = function copy(orig) {
  var n = {};
  if (orig) {
    Object.keys(orig).forEach(function(k) {
      n[k] = orig[k];
    });
  }
  return n;
};