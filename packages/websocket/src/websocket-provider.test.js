import WebSocketProvider from "./WebSocketProvider";
describe("WebSocket Provider", () => {
  it("should not explode", () => {
    expect(() => {
      WebSocketProvider();
    }).not.toThrow();
  });
});
