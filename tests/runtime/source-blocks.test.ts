import { describe, expect, it } from "bun:test";
import { inspectSlexSource } from "../../src/html/inspect";

describe("HTML source is one document per Markdown block", () => {
  it("accepts multiple sibling HTML roots without object-array extraction", () => {
    const source = '<slex-card id="a"></slex-card><slex-card id="b"></slex-card>';
    expect(inspectSlexSource(source)).toMatchObject({ ok: true, value: source });
  });

  it("rejects legacy arrays and never splits comma-separated text into documents", () => {
    expect(inspectSlexSource('[{layout:{}},{layout:{}}]').diagnostic?.code).toBe("legacy-object-source");
    const commaText = '({layout:{}}),({layout:{}})';
    expect(inspectSlexSource(commaText)).toMatchObject({ ok: true, value: commaText });
  });
});
