// Middleware
import { forAny } from "./util";
export class Middleware {
  constructor() {
    this.stack = [];
  }

  use(cb) {
    return forAny(cb, m => this.stack.push(m));
  }

  remove(cb) {
    return forAny(cb, m => this.stack.splice(this.stack.indexOf(m) >>> 0, 1));
  }

  compose(stack = false) {
    return Middleware.compose(stack || this.stack);
  }

  static compose(stack = []) {
    if (!Array.isArray(stack))
      throw new TypeError("Middleware stack must be an array!");
    for (const fn of stack) {
      if (typeof fn !== "function")
        throw new TypeError("Middleware must be composed of functions!");
    }

    return async function(context, next) {
      let last = -1;
      async function stackAt(i) {
        if (i <= last) {
          return Promise.reject(new Error("next() called multiple times"));
        }

        const fn = i === stack.length ? next : stack[i];
        if (!fn) return;
        last = i;
        try {
          return await fn(context, function() {
            return stackAt(i + 1);
          });
        } catch (err) {
          return Promise.reject(err);
        }
      }
      return stackAt(0);
    };
  }
}
export default Middleware;
