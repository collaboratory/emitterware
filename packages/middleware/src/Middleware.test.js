const { Middleware } = require("./Middleware");
describe("Middleware", () => {
  it("should allow addition of a single middleware method", () => {
    const stack = new Middleware();
    const appended = stack.use(() => {});
    expect(appended).toBeTruthy();
  });
  it("should allow addition of multiple middleware methods", () => {
    const stack = new Middleware();
    const appended = stack.use([() => {}, () => {}]);
    expect(appended).toBeTruthy();
  });

  it("should allow removal of a single middleware method", () => {
    const stack = new Middleware();
    const method = () => {};
    stack.use(method);
    const removed = stack.remove(method);
    expect(removed).toBeTruthy();
    expect(stack.stack.length).toBe(0);
  });

  it("should allow removal of multiple middleware methods", () => {
    const stack = new Middleware();
    const methods = [() => {}, () => {}, () => {}];
    stack.use(methods);
    expect(stack.stack.length).toBe(3);
    const removed = stack.remove(methods);
    expect(removed).toBeTruthy();
    expect(stack.stack.length).toBe(0);
  });

  it("should allow composition of the middleware stack", () => {
    const stack = new Middleware();
    stack.use(() => {});
    const composed = stack.compose();
    expect(typeof composed).toBe("function");
  });

  it("should only allow composing arrays consisting of functions", () => {
    const stack = new Middleware();
    expect(() => {
      stack.compose("asdf");
    }).toThrow();

    expect(() => {
      stack.compose(["asdf"]);
    }).toThrow();
  });

  it("should throw & reject on multiple next() calls", async () => {
    const stack = new Middleware();
    stack.use(async (ctx, next) => {
      await next();
      const promise = next();
      expect(promise).rejects.toThrow();
    });

    stack.use(async (ctx, next) => {
      await next();
    });

    await stack.compose()(true);
  });

  it("should handle middleware errors gracefully", () => {
    const stack = new Middleware();
    stack.use((ctx, next) => {
      ctx.fail();
    });

    expect(stack.compose()()).rejects.toThrow();
  });

  it("should allow synchronous execution", async () => {
    const stack = new Middleware();
    const o = { test: 0 };

    stack.use((ctx, next) => {
      ctx.test++;
      return next();
    });

    stack.use((ctx, next) => {
      ctx.test += 2;
      return next();
    });

    stack.compose()(o);
    expect(o.test).toBe(3);
  });

  it("should allow asynchronous execution", async () => {
    const stack = new Middleware();
    const o = { test: 0 };

    stack.use(async (ctx, next) => {
      ctx.test++;
      await next();
    });

    stack.use(async (ctx, next) => {
      ctx.test += 2;
      await next();
    });

    stack.use(async (ctx, next) => {
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 100);
      });
      ctx.test += 4;
      await next();
    });

    stack
      .compose()(o)
      .then(() => {
        expect(o.test).toBe(7);
      });
  });
});
