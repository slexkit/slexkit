import { describe, expect, it } from "bun:test";
import { describeSlexElements } from "../../src/web-components";
import { inspectSlexSource } from "../../src/html/inspect";

describe("native JavaScript utility surface", () => {
  it("does not inject a std expression namespace into components", () => {
    expect(describeSlexElements().flatMap(item => item.properties).some(prop => prop.name === "std")).toBe(false);
    expect(inspectSlexSource('({layout:{"text:x":{$text:"std.round(1.2)"}}})').ok).toBe(false);
  });

  it("uses standard JavaScript functions in isolated module scripts", () => {
    const source = '<output id="result"></output><script>const values=[1.2,2.8];slex.root.querySelector("#result").value=String(Math.max(...values))</script>';
    expect(inspectSlexSource(source).ok).toBe(true);
  });
});
