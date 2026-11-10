import { describe, expect, test } from "bun:test";
import { inspectSlexSource, parseSlexSource, validateSlexSource } from "../../src/html/inspect";

describe("HTML static inspection", () => {
  test("accepts HTML, SVG, CSS, custom elements and inline modules without executing", () => {
    (globalThis as { __htmlInspectionRan?: boolean }).__htmlInspectionRan = false;
    const source = `<style>.x{color:red}</style><svg viewBox="0 0 1 1"><path d="M0 0h1"/></svg>
      <slex-card id="card"><button id="go">Go</button></slex-card>
      <script>globalThis.__htmlInspectionRan = true; slex.root.dataset.ready = "yes";</script>`;
    const result = inspectSlexSource(source);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(source);
    expect((globalThis as { __htmlInspectionRan?: boolean }).__htmlInspectionRan).toBe(false);
    expect(parseSlexSource(source)).toEqual(result);
  });

  test("rejects non-strings and legacy object source", () => {
    expect(inspectSlexSource({ layout: {} }).diagnostic?.code).toBe("source-type");
    const result = inspectSlexSource(`{ slex: "0.5", layout: { "text:x": { text: "x" } } }`);
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.code).toBe("legacy-object-source");
    expect(result.diagnostic?.start).toEqual({ offset: 0, line: 1, column: 1 });
  });

  test("rejects active content, handlers, executable URLs and navigation", () => {
    const source = `<iframe src="https://example.test"></iframe>
      <button onclick="run()">bad</button><a href="javascript:run()">bad</a>
      <meta http-equiv="refresh" content="0;url=https://example.test"><object></object>`;
    const result = validateSlexSource(source);
    expect(result.valid).toBe(false);
    expect(result.errors.map(item => item.code)).toEqual(expect.arrayContaining([
      "active-embedded-content", "inline-event-handler", "executable-url", "meta-navigation",
    ]));
    expect(result.errors.every(item => item.start && item.start.line > 0 && item.start.column > 0)).toBe(true);
  });

  test("rejects external script sources and every static module import form", () => {
    for (const source of [
      `<script src="https://example.test/a.js"></script>`,
      `<script type="module">import value from "https://example.test/a.js"</script>`,
      `<script>const value = import("https://example.test/a.js")</script>`,
      `<script>export { value } from "https://example.test/a.js"</script>`,
    ]) expect(inspectSlexSource(source).ok).toBe(false);
  });

  test("keeps data scripts inert and reports inline module syntax positions", () => {
    expect(inspectSlexSource(`<script type="application/json">{"x":1}</script>`).ok).toBe(true);
    const result = inspectSlexSource(`<div>ok</div>\n<script type="module">\nconst = 1\n</script>`);
    expect(result.diagnostic?.code).toBe("invalid-module-script");
    expect(result.diagnostic?.start?.line).toBe(3);
  });

  test("inspects active content nested inside template.content", () => {
    const result = inspectSlexSource(`<template id="deferred"><button onclick="bad()">Bad</button><script src="https://evil.test/x.js"></script></template>`);
    expect(result.ok).toBe(false);
    expect(result.diagnostics?.map(item => item.code)).toEqual(expect.arrayContaining(["inline-event-handler", "external-script"]));
    expect(result.diagnostics?.every(item => item.start?.line === 1)).toBe(true);
  });

  test("detects commented legacy object syntax without evaluation", () => {
    const result = inspectSlexSource(`// old source\n/* retained note */\n{ slex: "0.5", layout: {} }`);
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.code).toBe("legacy-object-source");
    expect(result.diagnostic?.start).toEqual({ offset: 34, line: 3, column: 1 });
  });

  test("normalizes control and whitespace obfuscation in executable URL schemes", () => {
    for (const source of [
      `<a href="java&#10;script:alert(1)">x</a>`,
      `<a href="data : text/html,&lt;script>bad()&lt;/script>">x</a>`,
      `<img src="data:image/svg+xml,&lt;svg onload=bad()>">`,
    ]) expect(inspectSlexSource(source).diagnostic?.code).toBe("executable-url");
  });

  test("reports recoverable HTML as warnings and unclosed executable scripts as errors", () => {
    const recovered = inspectSlexSource(`<section><div>streaming`);
    expect(recovered.ok).toBe(true);
    expect(recovered.warnings.map(item => item.code)).toContain("unclosed-html-element");
    const script = inspectSlexSource(`<div>ok</div><script>const value = 1`);
    expect(script.ok).toBe(false);
    expect(script.diagnostics?.map(item => item.code)).toContain("incomplete-script");
  });
});
