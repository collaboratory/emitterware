const { Emitter } = require("./Emitter");

const runEmitTest = async (obj, isAsync = false) => {
  const emitMethod = isAsync
    ? async data => {
        await new Promise((resolve, reject) => {
          setTimeout(() => resolve(true), 10);
        });
        data.num++;
      }
    : data => {
        data.num++;
      };

  const instance = new Emitter();
  instance.on("test", emitMethod);

  const emits = [
    instance.emit("test", obj, isAsync),
    instance.emit("test", obj, isAsync),
    instance.emit("test", obj, isAsync),
    instance.emit("test", obj, isAsync),
    instance.emit("test", obj, isAsync)
  ];

  return isAsync ? Promise.all(emits) : emits;
};

describe("Emitter", function() {
  it("should construct without error", () => {
    const instance = new Emitter();
    expect(instance).toBeTruthy();
  });

  it("should allow addition of event handlers", () => {
    const instance = new Emitter();
    const added = instance.on("test", () => {});
    expect(added).toBeTruthy();
  });

  it("should provide a count of registered event handlers", () => {
    const instance = new Emitter();
    instance.on("test", () => {});
    expect(instance.size()).toBe(1);
  });

  it("should allow removal of event handlers", () => {
    const instance = new Emitter();
    const cb = () => {};
    instance.on("test", cb);
    expect(instance.size()).toBe(1);
    instance.off("test", cb);
    expect(instance.size()).toBe(0);
  });

  it("should allow async emitting of events", async () => {
    const obj = { num: 0 };
    await runEmitTest(obj, true);

    expect(obj.num).toBe(5);
  });

  it("should default to synchronous emitting of events", async () => {
    const obj = { num: 0 };
    runEmitTest(obj);

    expect(obj.num).toBe(5);
  });
});
