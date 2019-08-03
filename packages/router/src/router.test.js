const Router = require("./router");

describe("Router", () => {
  it("should allow registration of routes", () => {
    const fn = jest.fn();
    const r = new Router();
    r.use("/test", fn);
    expect(r.routes.hasOwnProperty("/test")).toBe(true);
  });

  it("should support exact route matches", async () => {
    const r = new Router();
    r.use("/api", async (ctx, next) => {
      console.log("Here");
      ctx.request.testRouter = true;
      await next();
    });

    const ctx = {
      request: {
        url: "/api",
        testRouter: false
      }
    };

    const next = jest.fn();
    await r.middleware(ctx, next);
    expect(next).toHaveBeenCalled();
    expect(ctx.request.testRouter).toBe(true);
  });

  it("should support parsed route matches", async () => {
    const r = new Router();
    r.use(`/api/:id/*_`, async (ctx, next) => {
      ctx.request.testRouter = true;
      await next();
    });

    const ctx = {
      request: {
        url: "/api/123/test",
        testRouter: false
      }
    };

    const next = jest.fn();
    await r.middleware(ctx, next);
    expect(next).toHaveBeenCalled();
    expect(ctx.request.match.id).toBe("123");
    expect(ctx.request.match._).toBe("test");
    expect(ctx.request.testRouter).toBe(true);
  });
});
