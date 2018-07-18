import { Emitterware } from "@emitterware/emitterware";
export class EmitterwareApp {
  constructor(options = {}) {
    this.options = options;
    this.providers = new Map();
    this.stack = new Emitterware();
  }

  provider(name, provider) {
    if (this.providers.has(name)) {
      throw new Error(
        "Emitterware already has a provider registered for '" + name + "'"
      );
    }

    this.providers.set(
      name,
      provider(request => Promise.resolve(this.request(request, name)))
    );
  }

  removeProvider(name) {
    this.providers.remove(name);
  }

  middleware(method, emitter = "*", priority = 0) {
    this.stack.on(emitter, method, priority);
  }
  use = this.middleware;

  removeMiddleware(method, emitter = "*") {
    this.stack.off(emitter, method);
  }
  remove = this.removeMiddleware;

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
}
export default EmitterwareApp;
