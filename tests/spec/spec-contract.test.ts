import { describe, expect, it } from "bun:test";
import { inspectSlexSource, parseSlexSource, validateSlexSource } from "../../src/html/inspect";
import { createStandardArtifacts, SLEX_HTML_PROFILE_VERSION, SLEX_SCHEMA_VERSION } from "../../src/standard/artifacts";

describe("HTML authoring specification", () => {
  it("accepts native HTML, SVG, styles, custom elements, slots, and inline modules", () => {
    const source = `
      <style>.metric { display: grid; }</style>
      <section aria-labelledby="title">
        <h2 id="title">Status</h2>
        <slex-card title="Metrics">
          <slex-tabs id="views" value="summary">
            <div slot="summary"><slex-stat label="Ready" value="3"></slex-stat></div>
            <div slot="details"><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"></circle></svg></div>
          </slex-tabs>
        </slex-card>
      </section>
      <script type="module">
        const tabs = slex.root.querySelector("#views");
        tabs.addEventListener("change", () => {}, { signal: slex.signal });
      </script>`;
    expect(inspectSlexSource(source)).toMatchObject({ ok: true, value: source, warnings: [] });
    expect(parseSlexSource(source)).toEqual(inspectSlexSource(source));
    expect(validateSlexSource(source)).toMatchObject({ ok: true, valid: true, errors: [] });
  });

  it("rejects non-string and legacy object g/layout source without fallback", () => {
    for (const source of [
      { g: {}, layout: {} },
      "{ g: {}, layout: {} }",
      '{ "slex": "0.1", "layout": { "text:message": { "text": "old" } } }',
    ]) {
      const result = inspectSlexSource(source);
      expect(result.ok, JSON.stringify(source)).toBe(false);
      expect(result.diagnostic?.code).toMatch(/^(?:source-type|legacy-object-source)$/);
    }
  });

  it("rejects executable attributes/resources and embedded browsing contexts", () => {
    const cases = [
      ['<button onclick="run()">Run</button>', "inline-event-handler"],
      ['<script src="https://example.com/a.js"></script>', "external-script"],
      ["<script>import('https://example.com/a.js')</script>", "external-import"],
      ['<link rel="stylesheet" href="https://example.com/a.css">', "external-resource"],
      ['<a href="javascript:alert(1)">Run</a>', "executable-url"],
      ['<iframe src="https://example.com"></iframe>', "active-embedded-content"],
      ['<meta http-equiv="refresh" content="0;url=https://example.com">', "meta-navigation"],
    ] as const;
    for (const [source, code] of cases) {
      expect(inspectSlexSource(source), code).toMatchObject({ ok: false, diagnostic: { code } });
    }
  });

  it("performs static inspection without running malicious source", () => {
    const marker = "__slexkit_spec_nonexecution__";
    delete (globalThis as Record<string, unknown>)[marker];
    const source = `<script>globalThis.${marker} = true;</script>`;
    expect(inspectSlexSource(source).ok).toBe(true);
    expect(validateSlexSource(source).valid).toBe(true);
    expect((globalThis as Record<string, unknown>)[marker]).toBeUndefined();
  });

  it("publishes the HTML profile and AbortSignal SDK instead of expression bindings", () => {
    const build = createStandardArtifacts("0.5.0", "2026-01-01T00:00:00.000Z");
    const profile = build.artifacts["slex-html-profile.json"] as {
      schemaVersion: string;
      profileVersion: string;
      sourceType: string;
      rejectedLegacyForms: string[];
    };
    const sdk = build.artifacts["slex-sandbox-sdk.json"] as {
      members: Record<string, { kind?: string; signature?: string }>;
    };
    expect(profile).toMatchObject({
      schemaVersion: SLEX_SCHEMA_VERSION,
      profileVersion: SLEX_HTML_PROFILE_VERSION,
      sourceType: "HTML fragment string",
    });
    expect(profile.rejectedLegacyForms).toEqual(expect.arrayContaining([
      "object g/layout envelope", "expression-string attributes",
    ]));
    expect(sdk.members.signal).toEqual(expect.objectContaining({ kind: "AbortSignal" }));
    expect(sdk.members.signal.signature).toBeUndefined();
  });
});
