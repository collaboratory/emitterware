const { Emitterware } = require("./Emitterware");

describe("Emitterware", function() {
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
      instance.emit("test", obj)
    ]);

    expect(obj.num).toBe(8);
  });
});
