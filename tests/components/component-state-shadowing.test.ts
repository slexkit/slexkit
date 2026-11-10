import { describe, expect, it } from "bun:test";
import { describeSlexElements } from "../../src/web-components";
import { mountSlexElement } from "../helpers";

describe("component state without expression-context shadowing", () => {
  it("publishes no expression or binding properties", () => {
    const properties = describeSlexElements().flatMap(item => item.properties.map(prop => prop.name));
    expect(properties.some(name => name.startsWith("$") || name.startsWith("onchange"))).toBe(false);
  });

  it("keeps identically named controls independent through live properties", () => {
    const left = mountSlexElement("input", { value: "left" });
    const right = document.createElement("slex-input") as typeof left;
    right.value = "right";
    document.body.append(right);
    left.value = "changed";
    expect(right.value).toBe("right");
  });
});
