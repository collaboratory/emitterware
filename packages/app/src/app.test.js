const App = require("./app");
const Emitterware = require("@emitterware/emitterware");

describe("@emitterware/app", () => {
  describe("module", () => {
    it("should expose a class", () => {
      expect(() => new App()).not.toThrow();
    });
  });

  describe("constructor", () => {
    const app = new App({
      foo: "bar"
    });

    it("should store passed options", () => {
      expect(app.options.foo).toBe("bar");
    });

    it("should initialize providers and registry", () => {
      expect(app.providers).toBeInstanceOf(Map);
      expect(app.registry).toBeInstanceOf(Map);
      expect(app.stack).toBeInstanceOf(Emitterware);
    });
  });

  describe("subscribe", () => {
    const app = new App();
    it("should require providers to provide a valid id", () => {
      expect(() => {
        app.subscribe({});
      }).toThrow("Provider must supply a unique ID");
    });

    it("should require providers to provide a valid handler", () => {
      expect(() => {
        app.subscribe({ id: "test" });
      }).toThrow("Provider must supply a valid handler method");
    });

    it("should not allow registration of duplicate provider IDs", () => {
      const app = new App();
      const testProvider = { id: 1, handler: () => {} };
      app.subscribe(testProvider);
      expect(() => {
        app.subscribe(testProvider);
      }).toThrow("Provider already registered: 1");
    });

    it("should allow subscription to valid event providers", () => {
      expect(() => {
        const app = new App();
        app.subscribe({
          id: "test",
          handler: () => {}
        });
      }).not.toThrow();
    });
  });

  describe("unsubscribe", () => {
    const app = new App();

    it("should allow unsubscription given a provider object", () => {
      const testProvider = {
        id: "test",
        handler: () => app.request({}, "test")
      };
      app.subscribe(testProvider);
      expect(app.providers.has("test")).toBe(true);
      expect(app.unsubscribe(testProvider)).toBe(true);
      expect(app.providers.has("test")).toBe(false);
    });

    it("should allow unsubscription given a provider id", () => {
      const testProvider = {
        id: "test",
        handler: () => app.request({}, "test")
      };
      app.subscribe(testProvider);
      expect(app.providers.has("test")).toBe(true);
      expect(app.unsubscribe("test")).toBe(true);
      expect(app.providers.has("test")).toBe(false);
    });
  });
});
