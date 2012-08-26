module.exports = function repeat (c, len) {
  var ret = '';
  while (ret.length < len) ret += c;
  return ret;
};