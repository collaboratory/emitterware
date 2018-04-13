// Emitterware
import { Middleware } from "./Middleware";

export class Emitterware {
  constructor() {
    this.store = Object.create(null);
    this._cache = {};
  }

  on(e, cb, priority = 0) {
    this.stack(e).push({ cb, priority });
    this.cache(e, true);
  }

  off(e, cb) {
    const channel = this.stack(e);
    channel.filter(o => o.cb === cb).map(entry => {
      channel.splice(channel.indexOf(entry) >>> 0, 1);
    });
    this.cache(e, true);
  }

  emit(e, ctx, ...p) {
    return this.cache(e)(ctx, ...p);
  }

  eventProxy(e) {
    return (ctx, ...p) => this.cache(e)(ctx, ...p);
  }

  stack(named) {
    return this.store[named] || ((this.store[named] = []) && this.store[named]);
  }

  size() {
    return Object.values(this.store)
      .map(v => v.length)
      .reduce((a, b) => a + b, 0);
  }

  sorted(name) {
    return [...(name !== "*" && this.stack("*")), ...this.stack(name)]
      .filter(f => !!f && f)
      .sort((a, b) => a.priority - b.priority)
      .map(m => m.cb);
  }

  cache(name, forceReload = false) {
    if (!this._cache[name] || forceReload) {
      this._cache[name] = Middleware.compose(this.sorted(name));
    }
    return this._cache[name];
  }
}
export default Emitterware;
