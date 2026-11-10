import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { inspectSlexSource } from "../../src/html/inspect";
import {
  createStandardArtifacts,
  hashStandardText,
  SLEX_HTML_PROFILE_VERSION,
  SLEX_SCHEMA_VERSION,
  SLEX_STANDARD_ARTIFACTS,
} from "../../src/standard/artifacts";
import { describeSlexElements } from "../../src/web-components/definitions";

describe("Slex HTML standard artifacts", () => {
  async function packageVersion() {
    return (JSON.parse(await readFile("package.json", "utf8")) as { version: string }).version;
  }

  it("generates deterministic non-empty artifacts with exact hashes and version metadata", async () => {
    const version = await packageVersion();
    const generatedAt = "2026-01-01T00:00:00.000Z";
    const first = createStandardArtifacts(version, generatedAt);
    const second = createStandardArtifacts(version, generatedAt);
    expect(first).toEqual(second);
    expect(Object.keys(first.files)).toEqual([...SLEX_STANDARD_ARTIFACTS]);

    for (const filename of SLEX_STANDARD_ARTIFACTS) {
      expect(first.files[filename].length, filename).toBeGreaterThan(100);
      expect(first.files[filename].endsWith("\n"), filename).toBe(true);
      expect(hashStandardText(first.files[filename]), filename).toMatch(/^[0-9a-f]{8}$/);
    }

    const manifest = first.artifacts["slex-standard-manifest.json"] as {
      version: string;
      schemaVersion: string;
      profileVersion: string;
      generatedAt: string;
      compatibility: { legacyObjectSource: boolean; expressionAttributes: boolean };
      artifacts: Record<string, { path: string; hash: string }>;
    };
    expect(manifest).toMatchObject({
      version,
      schemaVersion: SLEX_SCHEMA_VERSION,
      profileVersion: SLEX_HTML_PROFILE_VERSION,
      generatedAt,
      compatibility: { legacyObjectSource: false, expressionAttributes: false },
    });
    for (const filename of SLEX_STANDARD_ARTIFACTS.filter((name) => name !== "slex-standard-manifest.json")) {
      expect(manifest.artifacts[filename]).toEqual({
        path: `/standard/${filename}`,
        hash: hashStandardText(first.files[filename]),
      });
    }
  });

  it("describes all default property/slot/event contracts and the optional playground", async () => {
    const build = createStandardArtifacts(await packageVersion(), "2026-01-01T00:00:00.000Z");
    const catalog = build.artifacts["slex-custom-elements.catalog.json"] as {
      generatedFrom: string;
      defaultComponentCount: number;
      optionalComponentCount: number;
      componentCount: number;
      elements: Array<{
        tagName: string;
        properties: Array<{ name: string; attribute?: string; type: string }>;
        slots: string[];
        events: string[];
        availability: "default" | "optional";
        entrypoint: string;
      }>;
    };
    expect(catalog).toMatchObject({
      generatedFrom: "src/web-components/definitions.ts",
      defaultComponentCount: 28,
      optionalComponentCount: 1,
      componentCount: 29,
    });
    const defaults = catalog.elements.filter((item) => item.availability === "default");
    expect(defaults).toEqual(describeSlexElements().map((element) => ({
      ...element,
      availability: "default",
      entrypoint: "slexkit/web-components",
    })));
    expect(catalog.elements.at(-1)).toMatchObject({
      tagName: "slex-playground",
      availability: "optional",
      entrypoint: "slexkit/tooling",
    });
  });

  it("publishes an AbortSignal SDK and explicit fail-closed static policy", async () => {
    const build = createStandardArtifacts(await packageVersion(), "2026-01-01T00:00:00.000Z");
    const sdk = build.artifacts["slex-sandbox-sdk.json"] as {
      members: Record<string, { kind?: string; signature?: string; members?: string[]; values?: string }>;
    };
    const policy = build.artifacts["slex-static-policy.json"] as {
      inspectionExecutesSource: boolean;
      rejected: string[];
      nativeNetworkDefaults: string;
      note: string;
    };
    expect(sdk.members.signal).toMatchObject({ kind: "AbortSignal" });
    expect(sdk.members.signal.signature).toBeUndefined();
    expect(sdk.members.shared).toMatchObject({ members: ["get", "set", "subscribe"], values: "JSON" });
    expect(policy.inspectionExecutesSource).toBe(false);
    expect(policy.rejected).toEqual(expect.arrayContaining([
      "external scripts", "JavaScript imports", "inline event-handler attributes",
      "embedded frames/plugins", "executable URL schemes",
    ]));
    expect(policy.nativeNetworkDefaults).toBe("blocked");
    expect(policy.note).toContain("not a security boundary");
  });

  it("keeps every source conformance fixture aligned with static inspection", async () => {
    const build = createStandardArtifacts(await packageVersion(), "2026-01-01T00:00:00.000Z");
    const conformance = build.artifacts["slex-html-conformance.json"] as {
      schemaVersion: string;
      profileVersion: string;
      fixtures: Array<{ id: string; kind: "valid" | "invalid"; source: string; expected: { ok: boolean; diagnostic?: string } }>;
    };
    expect(conformance.schemaVersion).toBe(SLEX_SCHEMA_VERSION);
    expect(conformance.profileVersion).toBe(SLEX_HTML_PROFILE_VERSION);
    expect(conformance.fixtures.length).toBeGreaterThanOrEqual(16);
    expect(new Set(conformance.fixtures.map((fixture) => fixture.id)).size).toBe(conformance.fixtures.length);
    expect(conformance.fixtures.some((fixture) => fixture.kind === "valid")).toBe(true);
    expect(conformance.fixtures.some((fixture) => fixture.kind === "invalid")).toBe(true);
    for (const fixture of conformance.fixtures) {
      const result = inspectSlexSource(fixture.source);
      expect(result.ok, fixture.id).toBe(fixture.expected.ok);
      if (fixture.expected.diagnostic)
        expect(result.diagnostic?.code, fixture.id).toBe(fixture.expected.diagnostic);
    }
  });
});
