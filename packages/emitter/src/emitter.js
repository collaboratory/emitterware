// Emitter
class Emitter {
  constructor() {
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.emit = this.emit.bind(this);
    this.event = this.event.bind(this);
    this.size = this.size.bind(this);
    this.store = Object.create(null);
  }

  on(event, cb) {
    return this.event(event).push(cb);
  }

  off(event, cb = false) {
    const stack = this.event(event);
    if (cb === false) {
      return stack.splice(0, stack.length);
    }

    return stack.splice(stack.indexOf(cb) >>> 0, 1);
  }

  emit(event, data, isAsync = false) {
    console.log("Emitting", event, data);
    const result = this.event(event).map(cb => cb(data));
    return isAsync ? Promise.all(result) : result;
  }

  event(named) {
    return !this.store[named]
      ? (this.store[named] = []) && this.store[named]
      : this.store[named];
  }

  size() {
    return Array.from(Object.values(this.store), s => s.length).reduce(
      (a, b) => a + b,
      0
    );
  }
}
module.exports = Emitter;
