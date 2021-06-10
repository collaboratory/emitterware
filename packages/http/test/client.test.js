import HTTPClient from "../src/client.js";

let client;
describe("http client", () => {
  beforeAll(() => {
    client = new HTTPClient();
  });

  it("should allow the user to make GET requests", () => {
    return client.fetch("http://google.com").then((res) => {
      expect(res.status).toBe(301);
      expect(res.body.length).toBe(219);
    });
  });
});
