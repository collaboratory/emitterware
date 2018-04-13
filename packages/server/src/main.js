import { Emitterware } from "rhetoric";
export class EmitterwareServer {
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
      provider(async request => this.request(request, name))
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

  async request(ctx, provider) {
    await this.stack.emit(provider, ctx);
    return ctx;
  }
}
export default EmitterwareServer;
