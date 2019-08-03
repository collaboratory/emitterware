const App = require("@emitterware/app");
const http = require("./http");
const axios = require("axios");

describe("http provider", () => {
  let app, provider;

  beforeAll(done => {
    console.log("Creating provider");
    app = new App();
    provider = http({
      port: 3000,
      logger: console,
      loggerOptions: { disableHttp: true }
    });
    app.subscribe(provider);
  });

  afterAll(done => {
    console.log("Destroying provider");
    provider.server.close();
  });

  it("should expose a middleware converter", () => {
    expect(http.convertMiddleware).not.toBeUndefined();
  });

  it("should expose a context assembler", () => {
    expect(http.context).not.toBeUndefined();
  });

  it("should parse URL query parameters", async () => {
    let query;
    app.on("http", ctx => {
      console.log("Here");
      query = ctx.request.query.foo;
      ctx.response.body = "Hello!";
    });
    await axios.get("http://localhost:3000/?foo=true").then(res => {
      console.log(res.data);
    });
    expect(query).toBe("true");
  });

  it("should parse JSON request data", async () => {
    app.on("http", ctx => {
      expect(ctx.request.body).toBe({ foo: true });
    });
    await axios.post("http://localhost:3000/", { foo: true });
  });
});
