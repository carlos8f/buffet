module.exports = function gzippable(type) {
  type = type.split(';')[0];
  if (/(^text\/|(json|xml)$|^application\/(javascript$))/.exec(type)) {
    return true;
  }
};