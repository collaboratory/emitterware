import { Emitterware } from "@emitterware/emitterware";
export class EmitterwareApp {
  constructor(options = {}) {
    this.options = options;
    this.providers = new Map();
    this.registry = new Map();
    this.stack = new Emitterware();
  }

  subscribe(provider) {
    if (!provider.id || !provider.handler) {
      console.log(provider);
      throw new Error("Cannot subscribe to invalid provider");
    }

    if (this.providers.has(provider.id)) {
      throw new Error(`Provider already registered: ${provider.id}`);
    }

    this.providers.set(
      provider.id,
      provider.handler(
        request => Promise.resolve(this.request(request, provider.id)),
        this
      )
    );

    return provider.id;
  }

  unsubscribe(id) {
    this.providers.remove(id);
  }

  on(provider, callback, priority = 0) {
    this.stack.on(provider, callback, priority);
  }

  off(provider, callback) {
    this.stack.off(provider, callback);
  }

  use(callback, priority = 0) {
    this.stack.on('*', callback, priority);
  }

  request(ctx, provider) {
    return new Promise((resolve, reject) => {
      Promise.resolve(this.stack.emit(provider, ctx))
        .then(() => {
          resolve(ctx);
        })
        .catch(e => {
          reject(e);
        });
    });
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
export default EmitterwareApp;
