const Emitter = require("@emitterware/emitter");
const canObserve = source =>
  ["object", "array"].includes(typeof source) &&
  ![null, undefined].includes(source);

// TODO: Share emitter between observables. UUID per observable. Emit by key.

const Observable = function(source, options = {}) {
  let { onChange = null, parent = null, parentKey = null, emitter = null } =
    options || {};
  if (!emitter) {
    emitter = new Emitter();
  }

  const proxyHandler = {
    get: (obj, key) => {
      if (["on", "off", "emit"].includes(key)) {
        return emitter[key];
      }
      return source[key];
    },
    set: (obj, key, value) => {
      source[key] = value;
      emitter.emit("change", { key, value });
      if (parent) {
        parent.emit("change.child", { [parentKey]: { key, value } });
      }
      return true;
    },
    deleteProperty: (obj, key) => {
      if (key in obj) {
        delete source[key];
        emitter.emit("change", source);
        if (parent) {
          parent.emit("change.child", { [parentKey]: source });
        }
      }
    },
    defineProperty: (obj, key, value) => proxyHandler.set(obj, key, value)
  };
  const proxy = new Proxy(source, proxyHandler);
  if (Array.isArray(source)) {
    source = source.map(val =>
      canObserve(val) ? new Observable(val, { parent: proxy }) : val
    );
  } else {
    source = Object.keys(source).reduce((obj, key) => {
      return {
        ...obj,
        [key]: canObserve(source[key])
          ? new Observable(source[key], { parent: proxy })
          : source[key]
      };
    }, {});
  }

  if (onChange) {
    emitter.on("change", onChange);
  }

  emitter.on("change.child", props => {
    Object.keys(props).forEach(key => {
      source[key] = props[key];
    });
    emitter.emit("change", source);
  });

  return proxy;
};
module.exports = Observable;
