import Router from "./router";
describe("Router", () => {
  it("should allow registration of routes", () => {
    const fn = jest.fn();
    const r = new Router();
    r.use("/test", fn);
    expect(r.endpoints.has("/test")).toBe(true);
  });

  it("should support exact route matches", async () => {
    const r = new Router();
    r.use("/api", async (ctx, next) => {
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
    r.use(`/api/:id/(.*)`, async (ctx, next) => {
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
    expect(JSON.stringify(ctx.request.match._)).toBe(JSON.stringify(["test"]));
    expect(ctx.request.testRouter).toBe(true);
  });
});
