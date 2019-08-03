const websocket = require("./websocket");
describe("@emitterware/websocket", () => {
  it("should not explode", () => {
    expect(websocket).not.toThrow();
  });
});
