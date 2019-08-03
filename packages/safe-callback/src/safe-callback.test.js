const { safeCallback, safeCallbackWith } = require("./safe-callback");

describe("safeCallback", () => {
  it("should return a valid callback", () => {
    const cb = () => {};
    expect(safeCallback(cb)).toBe(cb);
  });

  it("should return a noop for non-method parameters", () => {
    const cb = safeCallback(false);
    expect(typeof cb).toBe("function");
    expect(cb).not.toThrow();
  });

  it("should throw when requested", () => {
    const cb = false;
    expect(() => safeCallback(cb, true, false)).toThrow();
  });
});

describe("safeCallbackWith", () => {
  it("should call a method on all members of an array", () => {
    let sum = 0;
    safeCallbackWith([1, 2, 3], e => {
      sum += e;
    });
    expect(sum).toBe(6);
  });

  it("should call a method once for non-array arguments", () => {
    let sum = 0;
    safeCallbackWith(42, e => {
      sum += e;
    });
    expect(sum).toBe(42);
  });
});
