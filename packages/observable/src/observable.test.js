const Observable = require("./observable");
const Emitter = require("@emitterware/emitter");
describe("@emitterware/observable", () => {
  it("should expose emitter methods", () => {
    const obs = new Observable({ foo: "bar" });
    const fn = jest.fn();
    obs.on("test", fn);
    obs.emit("test", true);
    expect(fn).toHaveBeenCalled();
  });

  it("should emit when changed", () => {
    const obs = new Observable({ foo: "bar" });
    const fn = jest.fn();
    obs.on("change", fn);
    obs.foo = false;
    expect(fn).toHaveBeenCalled();
  });

  it("should emit when children are changed", () => {
    const obs = new Observable({ foo: { bar: true } });
    const fn = jest.fn();
    obs.on("change", fn);
    obs.foo.bar = false;
    expect(fn).toHaveBeenCalled();
  });

  it("should support a custom emitter", () => {
    const emitter = new Emitter();
    const obs = new Observable({ foo: true }, { emitter });
    const fn = jest.fn();
    emitter.on("change", fn);
    obs.foo = false;
    expect(fn).toHaveBeenCalled();
  });

  it("should support arrays", () => {
    const obs = new Observable(["foo", "bar", "baz"]);
    const fn = jest.fn();
    obs.on("change", fn);
    obs.push("bang");
    expect(fn).toHaveBeenCalled();
    expect([...obs]).toEqual(["foo", "bar", "baz", "bang"]);
  });
});
