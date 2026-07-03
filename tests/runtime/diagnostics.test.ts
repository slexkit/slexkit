import { describe, expect, it } from "bun:test";
import { isLikelyIncompleteSlexSource, parseSlexSource, parseSlexStreamingSource } from "../../src/engine/diagnostics";

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
    const source = `{
  namespace: "broken",
  layout: {
    "card:demo": {
      title: "Missing close"
    }
  }
`;
    const result = parseSlexSource(source);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostic.detail).toContain("Expected closing delimiter");
      expect(result.diagnostic.excerpt).toContain("^");
      expect(isLikelyIncompleteSlexSource(source, result.diagnostic)).toBe(true);
    }
  });

  it("does not classify complete syntax mistakes as streaming-incomplete source", () => {
    const source = `{
  namespace: "broken",
  layout: {
    "card:demo": {
      foo:: 1
    }
  }
}`;
    const result = parseSlexSource(source);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isLikelyIncompleteSlexSource(source, result.diagnostic)).toBe(false);
    }
  });

  it("repairs EOF-only object and string prefixes for streaming render", () => {
    const objectPrefix = parseSlexStreamingSource(`{
  namespace: "stream_object",
  layout: {
    "text:message": { text: "object" }`, { mode: "repair" });
    expect(objectPrefix.status).toBe("repaired");
    if (objectPrefix.status === "repaired") {
      expect(objectPrefix.repairedSource.endsWith("}}")).toBe(true);
      expect(objectPrefix.repairs.map((repair) => repair.value)).toEqual(["}", "}"]);
    }

    const stringPrefix = parseSlexStreamingSource(`{
  layout: {
    "text:message": { text: "hello`, { mode: "repair" });
    expect(stringPrefix.status).toBe("repaired");
    if (stringPrefix.status === "repaired") {
      expect(stringPrefix.repairs.map((repair) => repair.value)).toEqual(["\"", "}", "}", "}"]);
      expect(stringPrefix.value).toMatchObject({
        layout: {
          "text:message": { text: "hello" },
        },
      });
    }
  });

  it("repairs arrays, parentheses, and block comments at EOF", () => {
    const result = parseSlexStreamingSource(`{
  namespace: "stream_comment",
  g: { value: (1 + 2), items: [1, 2 /* waiting`, { mode: "repair" });

    expect(result.status).toBe("repaired");
    if (result.status === "repaired") {
      expect(result.repairs.map((repair) => repair.value)).toEqual(["*/", "]", "}", "}"]);
      expect(result.value).toMatchObject({
        namespace: "stream_comment",
        g: { value: 3, items: [1, 2] },
      });
    }
  });

  it("keeps non-deterministic prefixes pending and hard syntax errors invalid", () => {
    const missingValue = parseSlexStreamingSource('{ layout: { "text:message": { text:', { mode: "repair" });
    expect(missingValue.status).toBe("pending");

    const missingColon = parseSlexStreamingSource('{ "text:message"', { mode: "repair" });
    expect(missingColon.status).toBe("pending");

    const danglingEscape = parseSlexStreamingSource('{ layout: { "text:message": { text: "hello\\', { mode: "repair" });
    expect(danglingEscape.status).toBe("pending");

    const invalid = parseSlexStreamingSource(`{
  layout: {
    "text:message": { foo:: 1 }
  }
}`, { mode: "repair" });
    expect(invalid.status).toBe("invalid");
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
