const Emitterware = require("@emitterware/emitterware");

class EmitterwareApp {
  constructor(options = {}) {
    this.options = options;
    this.providers = new Map();
    this.registry = new Map();
    this.stack = new Emitterware();
  }

  subscribe(provider) {
    if (!provider.id) {
      throw new Error(`Provider must supply a unique ID`);
    }

    if (!provider.handler || typeof provider.handler !== "function") {
      throw new Error(`Provider must supply a valid handler method`);
    }

    if (this.providers.has(provider.id)) {
      throw new Error(`Provider already registered: ${provider.id}`);
    }

    this.providers.set(provider.id, provider.handler);

    return provider.id;
  }

  unsubscribe(from) {
    return this.providers.delete(from.id || from);
  }

  on(provider, callback, priority = 0) {
    this.stack.on(provider, callback, priority);
  }

  off(provider, callback) {
    this.stack.off(provider, callback);
  }

  use(callback, priority = 0) {
    this.stack.on("*", callback, priority);
  }

  request(ctx, provider) {
    return this.stack.emit(provider, ctx);
  }

  register(...args) {
    const value = args.pop();
    const key = args.join(".");
    this.registry.set(key, value);
  }

  plugin(instance) {
    this.register("Plugin", instance.name, instance);
    instance.run(this);
  }

  registered(...args) {
    const key = args.join(".");
    return this.registry.has(key) && this.registry.get(key);
  }
}

module.exports = EmitterwareApp;
