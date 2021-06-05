export function callable(from, shouldThrow = false, source = false) {
  const fromType = typeof from;
  if (fromType !== "function") {
    if (shouldThrow) {
      throw new TypeError(CallableError(fromType, source));
    }
    return () => from;
  }
  return from;
}
export default callable;

export function forAll(thing, cb = null) {
  const callback = callable(cb, true, true);
  return Array.isArray(thing) ? thing.map(callback) : callback(thing);
}

const CallableError = (type = false, source = false) =>
  `${source || "callable"} requires a callback as the first parameter. ${
    type && `(${type} provided.)`
  }`;
