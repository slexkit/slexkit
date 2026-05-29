import { describe, expect, it } from "bun:test";
import { getRenderer } from "../../src/engine/index";
import { registerAll } from "../../src/components/index";

registerAll();

describe("runtime component boundary", () => {
  it("does not register the docs shell with runtime components", () => {
    expect(getRenderer("docs-shell")).toBeUndefined();
  });

  it("does not register the removed stepper component", () => {
    expect(getRenderer("stepper")).toBeUndefined();
  });
});
