import { jest } from "@jest/globals";
import Observable from "../src/observable";

describe("Observable - object proxy", () => {
  it("should emit when a property is added", () => {
    const onSet = jest.fn();
    const obs = new Observable({});
    obs.on("change", onSet);
    obs.foo = true;
    expect(onSet).toHaveBeenCalledTimes(1);
    expect(obs.foo).toEqual(true);
  });

  it("should emit when a property is deleted", () => {
    const onSet = jest.fn();
    const obs = new Observable({ foo: true });
    obs.on("change", onSet);
    delete obs.foo;
    expect(onSet).toHaveBeenCalledTimes(1);
    expect(obs.foo).toEqual(undefined);
  });

  it("should emit when a property is changed", () => {
    const onSet = jest.fn();
    const obs = new Observable({ foo: true });
    obs.on("change", onSet);
    obs.foo = false;
    expect(onSet).toHaveBeenCalledTimes(1);
    expect(obs.foo).toEqual(false);
  });

  it("should emit when a nested property is added", () => {
    const onSet = jest.fn();
    const obs = new Observable({ foo: {} });
    obs.on("change", onSet);
    obs.foo.bar = true;
    expect(onSet).toHaveBeenCalledTimes(1);
    expect(obs.foo.bar).toEqual(true);
  });

  it("should emit when a nested property is changed", () => {
    const onSet = jest.fn();
    const obs = new Observable({ foo: { bar: true } });
    obs.on("change", onSet);
    obs.foo.bar = false;
    expect(onSet).toHaveBeenCalledTimes(1);
    expect(obs.foo.bar).toEqual(false);
  });

  it("should emit when a nested property is deleted", () => {
    const onSet = jest.fn();
    const obs = new Observable({ foo: { bar: true } });
    obs.on("change", onSet);
    delete obs.foo.bar;
    expect(onSet).toHaveBeenCalledTimes(1);
    expect(obs.foo.bar).toEqual(undefined);
  });
});

describe("Observable - array proxy", () => {
  it("should emit when an item is added to the array", () => {
    const onSet = jest.fn();
    let obs = new Observable([]);
    obs.on("change", onSet);
    obs.push("foo");
    // calls set once for the key and once for the length
    expect(onSet).toHaveBeenCalledTimes(2);
    expect(obs).toEqual(["foo"]);
  });
});
