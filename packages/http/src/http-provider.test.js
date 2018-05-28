import WebProvider from "./provider";
describe("Web Provider", () => {
  it("should not explode", () => {
    expect(WebProvider).not.toThrow();
  });
});
