import { describe, expect, it } from "bun:test";
import { parseSlexSource } from "../../src/engine/diagnostics";

describe("Slex diagnostics", () => {
  it("locates an unexpected colon inside JS object syntax", () => {
    const result = parseSlexSource(`{
  namespace: "broken",
  layout: {
    "card:demo": {
      title: "ok",
      foo:: 1
    }
  }
}`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostic.message).toContain("Unexpected token ':'");
      expect(result.diagnostic.line).toBe(6);
      expect(result.diagnostic.column).toBe(11);
      expect(result.diagnostic.excerpt).toContain("foo:: 1");
      expect(result.error.message).toContain("line 6, column 11");
    }
  });

  it("points to the missing closing delimiter for incomplete objects", () => {
    const result = parseSlexSource(`{
  namespace: "broken",
  layout: {
    "card:demo": {
      title: "Missing close"
    }
  }
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostic.detail).toContain("Expected closing delimiter");
      expect(result.diagnostic.excerpt).toContain("^");
    }
  });

  it("locates the next string key when an object property comma is missing", () => {
    const result = parseSlexSource(`{
  namespace: "broken",
  layout: {
    "card:demo": {
      title: "Missing comma"
    }
    "card:next": { title: "Next" }
  }
}`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostic.message).toContain("Unexpected string");
      expect(result.diagnostic.line).toBe(7);
      expect(result.diagnostic.column).toBe(5);
      expect(result.diagnostic.excerpt).toContain('"card:next"');
    }
  });

  it("keeps unquoted dynamic $ props as runtime expressions", () => {
    const result = parseSlexSource(`{
  namespace: "dynamic_expr",
  g: { value: 2 },
  layout: {
    "text:summary": {
      $text: "value: " + g.value
    }
  }
}`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const script = result.value as { layout: { "text:summary": { $text: string } } };
      expect(script.layout["text:summary"].$text).toBe('"value: " + g.value');
    }
  });
});
