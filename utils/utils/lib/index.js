exports.isObject = function (o) {
  return Object.prototype.toString.call(o) === '[object Object]';
};
