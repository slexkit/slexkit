import { describe, expect, it } from "bun:test";
import { inspectSlexSource } from "../../src/html/inspect";

describe("HTML diagnostics", () => {
  it("reports inline module syntax with source positions", () => {
    const result = inspectSlexSource("<div>ok</div>\n<script>\nconst = 1\n</script>");
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.code).toBe("invalid-module-script");
    expect(result.diagnostic?.start?.line).toBe(3);
  });

  it("treats recoverable streaming HTML as warnings and executable script prefixes as errors", () => {
    const html = inspectSlexSource("<section><div>streaming");
    expect(html.ok).toBe(true);
    expect(html.warnings.map(item => item.code)).toContain("unclosed-html-element");
    expect(inspectSlexSource("<script>const value = 1").ok).toBe(false);
  });

  it("rejects closed legacy objects instead of repairing or evaluating them", () => {
    for (const source of ['({g:{value:1}})', '[{layout:{"text:x":{}}}]'])
      expect(inspectSlexSource(source).ok).toBe(false);
    expect(inspectSlexSource("{").value).toBe("{");
  });
});
