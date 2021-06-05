export class Emitter {
  constructor() {
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
    const result = this.event(event).map((cb) => cb(data));
    return isAsync ? Promise.all(result) : result;
  }

  event(named) {
    return !this.store[named]
      ? (this.store[named] = []) && this.store[named]
      : this.store[named];
  }

  size() {
    return Array.from(Object.values(this.store), (s) => s.length).reduce(
      (a, b) => a + b,
      0
    );
  }
}
export default Emitter;
