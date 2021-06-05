import { callable, forAll } from "../src/callable";
describe("callable", () => {
  it("should return a valid callback", () => {
    const cb = () => {};
    expect(callable(cb)).toBe(cb);
  });

  it("should return a noop for non-method parameters", () => {
    const cb = callable(false);
    expect(typeof cb).toBe("function");
    expect(cb).not.toThrow();
  });

  it("should throw when requested", () => {
    const cb = false;
    expect(() => callable(cb, true, false)).toThrow();
  });
});

describe("forAll", () => {
  it("should call a method on all members of an array", () => {
    let sum = 0;
    forAll([1, 2, 3], (e) => {
      sum += e;
    });
    expect(sum).toBe(6);
  });

  it("should call a method once for non-array arguments", () => {
    let sum = 0;
    forAll(42, (e) => {
      sum += e;
    });
    expect(sum).toBe(42);
  });
});
