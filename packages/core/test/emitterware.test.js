import Emitterware from "../src/emitterware";

describe("Emitterware", function () {
  it("should construct without error", () => {
    const instance = new Emitterware();
    expect(instance).toBeTruthy();
  });

  it("should allow addition of event handlers", () => {
    const instance = new Emitterware();
    instance.on("test", () => {});
    expect(instance.size()).toBe(1);
  });

  it("should allow removal of event handlers", () => {
    const method = () => {};
    const instance = new Emitterware();
    instance.on("test", method);
    expect(instance.size()).toBe(1);
    instance.off("test", method);
    expect(instance.size()).toBe(0);
  });

  it("should allow async emitting of events", async () => {
    const obj = { num: 0 };
    const instance = new Emitterware();

    instance.on("test", async (ctx, next) => {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(true);
        }, 10);
      });
      ctx.num++;
      await next();
    });

    await Promise.all([
      instance.emit("test", obj),
      instance.emit("test", obj),
      instance.emit("test", obj),
      instance.emit("test", obj),
      instance.emit("test", obj),
      instance.emit("test", obj),
      instance.emit("test", obj),
      instance.emit("test", obj),
    ]);

    expect(obj.num).toBe(8);
  });

  it("should allow promising the first named event emission", async () => {
    const instance = new Emitterware();
    const promise = instance.promise("test", false, 1);
    instance.emit("test", { foo: false, bar: true });
    instance.emit("test", { foo: true, bar: false });
    const promised = await Promise.resolve(promise);
    expect(promised).toMatchObject({ foo: false, bar: true });
  });

  it("should remove handler after resolving promised event emission", async () => {
    const instance = new Emitterware();
    const promise = instance.promise("test", false, 1);
    expect(instance.size()).toBe(1);
    instance.emit("test", { foo: false, bar: true });
    await Promise.resolve(promise);
    expect(instance.size()).toBe(0);
  });

  it("should allow promising filtered event emission", async () => {
    const instance = new Emitterware();
    const promise = instance.promise("test", (ctx) => ctx.foo === true, 1);
    instance.emit("test", { foo: false, bar: true });
    instance.emit("test", { foo: true, bar: false });
    const promised = await Promise.resolve(promise);
    expect(promised).toMatchObject({ foo: true, bar: false });
  });

  it("should reject promised event emission after a specified timeout", async () => {
    expect.assertions(1);
    try {
      const instance = new Emitterware();
      await instance.promise("test", (ctx) => ctx.foo === true, 1);
    } catch (e) {
      expect(e.message).toMatch("Timed out waiting for event to emit");
    }
  });
});
