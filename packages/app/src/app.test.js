const App = require("./app");

describe("@emitterware/app", () => {
  it("should expose a class", () => {
    expect(() => new App()).not.toThrow();
  });

  it("should allow registration of event providers", () => {
    expect(() => {
      const app = new App();
      app.subscribe({
        id: "test",
        handler: () => {}
      });
    }).not.toThrow();
  });

  it("should allow registration of event handlers", () => {
    const app = new App();
    const handler = jest.fn();
    const testProvider = {
      id: "test",
      handler: onRequest => {
        testProvider.onRequest = onRequest;
      },
      emit: data => testProvider.onRequest(data)
    };
    app.subscribe(testProvider);
  });
});
