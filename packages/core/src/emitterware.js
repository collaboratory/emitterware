import Middleware from "./middleware.js";

function stream(from, to, event = "*") {
  from.on(event, () => to.emit(...arguments));
}

function cancelStream(from, to, event = "*") {
  from.off(event, () => to.emit(...arguments));
}

export class Emitterware {
  constructor() {
    this.handlers = {};
    this.emitters = {};
  }

  on(
    eventName,
    cb,
    priority = Object.keys(this.handlers[eventName] || {}).length * -1
  ) {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push({ cb, priority });
    this.emitters[eventName] = this.build(eventName);
  }

  off(eventName, cb) {
    if (this.handlers[eventName]) {
      this.handlers[eventName] = this.handlers[eventName].filter(
        (h) => h.cb !== cb
      );
      if (this.handlers[eventName].length) {
        this.emitters[eventName] = this.build(eventName);
      } else delete this.emitters[eventName];
    }
  }

  build(eventName) {
    return Middleware.compose(
      [
        ...(this.handlers[eventName] || []),
        ...(eventName === "*" ? [] : this.handlers["*"] || []),
      ]
        .filter(Boolean)
        .sort((a, b) => a.priority - b.priority)
        .map((handler) => handler.cb)
    );
  }

  emit(eventName, ...details) {
    const stack = this.emitters[eventName] || this.emitters["*"];
    return stack(...details);
  }

  promise(eventName, filter = false, timeout = 10000) {
    return new Promise((resolve, reject) => {
      let t;
      const cb = (ctx, next) => {
        if (!filter || filter(ctx)) {
          clearTimeout(t);
          this.off(eventName, cb);
          return resolve(ctx, next);
        }
      };
      t = setTimeout(() => {
        this.off(eventName, cb);
        reject(new Error("Timed out waiting for event to emit"));
      }, timeout);
      this.on(eventName, cb);
    });
  }

  emitter(eventName) {
    return this.emitters[eventName] || false;
  }

  size() {
    return Object.values(this.handlers)
      .map((v) => v.length)
      .reduce((a, b) => a + b, 0);
  }
}
export default Emitterware;
