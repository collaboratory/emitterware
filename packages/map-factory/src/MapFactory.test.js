const { MapFactory } = require("./MapFactory");
const config = { a: 1, b: 1 };

function makeMethod() {
  return config => {
    config.a *= 10;
    config.b *= 100;
    return config;
  };
}

function makeFactory() {
  return new MapFactory(makeMethod(), config);
}

describe("MapFactory", () => {
  it("should require a function as the first parameter", () => {
    expect(() => new MapFactory(false)).toThrow();
  });

  it("should construct as expected", () => {
    const factory = makeFactory();
    expect(factory).toBeInstanceOf(MapFactory);
    expect(typeof factory.factory).toBe("function");
    expect(factory.map).toBeInstanceOf(Map);
    expect(factory.defaultParams).toBe(config);
  });

  it("should allow setting & getting variables", () => {
    const factory = makeFactory();
    [2, 5, 11, 23, 47, 95].forEach(n => {
      factory.set(`test:${n}`, { a: n, b: n + 1 });
      expect(factory.get(`test:${n}`)).toEqual(
        makeMethod()({ a: n, b: n + 1 })
      );
    });
  });

  it("should allow checking if a variable has been defined", () => {
    const factory = makeFactory();
    expect(factory.has("test:1")).toBe(false);
  });

  it("should allow getting undefined variables using configured default values", () => {
    const factory = makeFactory();
    expect(factory.get("foo:1")).toEqual({ a: 10, b: 100 });
  });

  it("should allow setting variables without using the factory", () => {
    const factory = makeFactory();
    const r = Math.random() * 200;
    factory.set("foo", { num: r }, false);
    expect(factory.get("foo").num).toBe(r);
  });

  it("should allow the user to check the size of the map", () => {
    const factory = makeFactory();
    expect(factory.size()).toBe(0);
    factory.get("test:1");
    factory.get("test:2");
    factory.get("test:3");
    expect(factory.size()).toBe(3);
  });

  it("should allow the user to reset the map", () => {
    const factory = makeFactory();
    factory.get("test:1");
    factory.get("test:2");
    factory.get("test:3");
    factory.get("test:4");
    expect(factory.size()).toBe(4);
    factory.reset();
    expect(factory.size()).toBe(0);
  });

  it("should allow the user to override the default params", () => {
    const factory = makeFactory();
    expect(factory.get("test:1")).toEqual({ a: 10, b: 100 });
    const newDefaults = { a: 2, b: 2 };
    factory.setDefaultParams(newDefaults);
    expect(factory.defaultParams).toBe(newDefaults);
    expect(factory.get("test:2")).toEqual({ a: 20, b: 200 });
  });

  it("should allow the user to override the factory method", () => {
    const factoryMethod = a => {
      config.a *= 42;
      config.b *= 23;
      return config;
    };
    const factory = makeFactory();
    factory.setFactory(factoryMethod);
    expect(factory.get("test:1")).toEqual({ a: 42, b: 23 });
  });
});
