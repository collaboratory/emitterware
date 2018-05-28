const { Emitter } = require("@emitterware/emitter");
export const Observable = function(
  source,
  onChange = null,
  parent = null,
  parentKey = null
) {
  const emitter = new Emitter();
  const proxyHandler = {
    get: (obj, key) => {
      if (key in source && typeof source[key] === "object") {
        return new Observable(obj[key], null, emitter, key);
      }
      return source[key];
    },
    set: (obj, key, value) => {
      source[key] = value;
      emitter.emit("change", { [key]: value });
      if (parent)
        parent.emit("change.child", { [parentKey]: { [key]: value } });
    },
    deleteProperty: (obj, key) => {
      if (key in obj) {
        delete source[key];
        emitter.emit("change", source);
        if (parent) parent.emit("change.child", { [parentKey]: source });
      }
    },
    defineProperty: (obj, key, value) => proxyHandler.set(obj, key, value)
  };
  if (onChange) {
    emitter.on("change", onChange);
  }
  emitter.on("change.child", props => {
    Object.keys(props).map(key => (source[key] = props[key]));
    emitter.emit("change", source);
  });
  return new Proxy(
    {
      ...source,
      onChange: cb => {
        emitter.on("change", cb);
      }
    },
    proxyHandler
  );
};
export default Observable;
