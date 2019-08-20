const http = require("./http");

describe("@emitterware/http", () => {
  it("should expose a middleware converter", () => {
    expect(http.convertMiddleware).not.toBeUndefined();
  });

  it("should expose a context assembler", () => {
    expect(http.context).not.toBeUndefined();
  });

  it("should parse URL query parameters", async () => {
    setImmediate(() =>
      http.mock({
        stack: ctx => {
          expect(ctx.request.query.foo).toBe("true");
          ctx.response.body = { bar: true };
        },
        request: {
          method: "get",
          url: `http://localhost:3000/?foo=true`
        }
      })
    );
  });

  it("should parse JSON request data", async () => {
    setImmediate(() =>
      http
        .mock({
          stack: ctx => {
            expect(ctx.request.body.foo).toBe(true);
            ctx.response.body = { bar: true };
          },
          request: {
            method: "post",
            data: {
              foo: true
            }
          }
        })
        .then(response => {
          expect(response.data).toMatchObject({ bar: true });
        })
    );
  });
});
