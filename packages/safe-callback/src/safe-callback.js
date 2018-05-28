export function safeCallback(from, shouldThrow = false, source = false) {
  const fromType = typeof from;
  if (fromType !== "function") {
    if (shouldThrow) {
      throw new TypeError(SafeCallbackError(fromType, source));
    }

    return () => from;
  }

  return from;
}
export default safeCallback;

export function safeCallbackWith(thing, cb = null) {
  const callback = safeCallback(cb, true, true);
  return Array.isArray(thing) ? thing.map(callback) : callback(thing);
}

const SafeCallbackError = (type = false, source = false) => `${
    source || "safeCallback"
  } requires a callback as the first parameter. ${
    type && `(${type} provided.)`
  }`;
