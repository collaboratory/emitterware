function safeCallback(from, shouldThrow = false, source = false) {
  const fromType = typeof from;
  if (fromType !== "function") {
    if (shouldThrow) {
      throw new TypeError(SafeCallbackError(fromType, source));
    }
    return () => from;
  }
  return from;
}

function safeCallbackWith(thing, cb = null) {
  const callback = safeCallback(cb, true, true);
  return Array.isArray(thing) ? thing.map(callback) : callback(thing);
}

module.exports = safeCallback;
module.exports.safeCallback = safeCallback;
module.exports.safeCallbackWith = safeCallbackWith;

const SafeCallbackError = (type = false, source = false) =>
  `${source ||
    "safeCallback"} requires a callback as the first parameter.${type &&
    ` (${type} provided.)`}`;
