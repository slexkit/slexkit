import { describe, expect, it } from "bun:test";
import { describeSlexElements } from "../../src/web-components";

describe("runtime component boundary", () => {
  it("does not publish site-only docs components", () => {
    expect(describeSlexElements().map(item => item.tagName)).not.toContain("slex-docs-shell");
  });

  it("does not publish the removed stepper component", () => {
    expect(describeSlexElements().map(item => item.tagName)).not.toContain("slex-stepper");
  });
});
