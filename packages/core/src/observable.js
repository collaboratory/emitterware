import Emitterware from "./emitterware.js";

export class Observable {
  constructor(
    source,
    { onChange = null, parent = null, parentKey = null, ...options } = {}
  ) {
    const emitter = options.emitter || new Emitterware();

    const proxyHandler = {
      get: (obj, key) => {
        if (["array", "object"].includes(typeof source[key])) {
          return new Observable(obj[key], {
            parentKey: key,
            parent: emitter,
          });
        } else if (["on", "off", "emit"].includes(key)) {
          return (...args) => emitter[key](...args);
        }

        return source[key];
      },
      set: (obj, key, value) => {
        source[key] = value;
        emitter.emit("change", { [key]: value });
        if (parent) {
          parent.emit("change", { [parentKey]: { [key]: value } });
        }
        return true;
      },
      deleteProperty: (obj, key) => {
        if (key in obj) {
          delete source[key];
          emitter.emit("change", source);
          if (parent) {
            parent.emit("change", { [parentKey]: source });
          }
        }
        return true;
      },
      defineProperty: (obj, key, value) => proxyHandler.set(obj, key, value),
    };

    emitter.on("set", (props) => {
      Object.assign(source, props);
      if (onChange) {
        onChange(source, props);
      }
    });

    return new Proxy(source, proxyHandler);
  }
}
export default Observable;
