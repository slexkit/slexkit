import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { publicComponentTypes } from "../../src/components/spec-registry";
import { validateSlexSource } from "../../src/engine/validation";
import {
  createStandardArtifacts,
  hashStandardText,
  SLEX_LOGIC_PROFILE_VERSION,
  SLEX_SCHEMA_VERSION,
  SLEX_STANDARD_ARTIFACTS,
} from "../../src/standard/artifacts";
import { SLEX_PROTOCOL_VERSION } from "../../src/version";

describe("Slex standard artifacts", () => {
  async function packageVersion() {
    const pkg = JSON.parse(await readFile("package.json", "utf-8")) as { version: string };
    return pkg.version;
  }

  it("generates non-empty deterministic artifacts with version metadata", async () => {
    const version = await packageVersion();
    const first = createStandardArtifacts(version, "2026-01-01T00:00:00.000Z");
    const second = createStandardArtifacts(version, "2026-01-01T00:00:00.000Z");

    expect(Object.keys(first.files)).toEqual([...SLEX_STANDARD_ARTIFACTS]);
    expect(first.files).toEqual(second.files);

    for (const filename of SLEX_STANDARD_ARTIFACTS) {
      expect(first.files[filename].length, filename).toBeGreaterThan(100);
      expect(hashStandardText(first.files[filename])).toMatch(/^[0-9a-f]{8}$/);
    }

    const manifest = first.artifacts["slex-standard-manifest.json"] as {
      version: string;
      schemaVersion: string;
      protocolVersion: string;
      logicProfileVersion: string;
      artifacts: Record<string, { path: string; hash: string }>;
    };
    expect(manifest.version).toBe(version);
    expect(manifest.schemaVersion).toBe(SLEX_SCHEMA_VERSION);
    expect(manifest.protocolVersion).toBe(SLEX_PROTOCOL_VERSION);
    expect(manifest.logicProfileVersion).toBe(SLEX_LOGIC_PROFILE_VERSION);
    for (const filename of SLEX_STANDARD_ARTIFACTS.filter((file) => file !== "slex-standard-manifest.json")) {
      expect(manifest.artifacts[filename]).toEqual({
        path: `/standard/${filename}`,
        hash: hashStandardText(first.files[filename]),
      });
    }
  });

  it("covers the public component catalog and logic-bearing profile", async () => {
    const build = createStandardArtifacts(await packageVersion(), "2026-01-01T00:00:00.000Z");
    const schema = build.artifacts["slex-expression.schema.json"] as {
      $defs: {
        layoutTree: { propertyNames: { $ref: string }; additionalProperties: { $ref: string } };
        componentNode: { properties: Record<string, unknown>; patternProperties: Record<string, unknown> };
        components: Record<string, unknown>;
      };
      properties: { layout: { $ref: string }; g: { $ref: string } };
    };
    const catalog = build.artifacts["slex-component-catalog.json"] as {
      componentCount: number;
      components: Array<{
        type: string;
        props: Record<string, { dynamic?: boolean }>;
        state: string;
        children: unknown;
        examples: unknown[];
        docs: unknown;
        jsonSchema: { properties: Record<string, unknown> };
        hash: string;
      }>;
    };
    const profile = build.artifacts["slex-logic-profile.json"] as {
      readPipes: unknown;
      writePipes: unknown;
      structuralDirectives: Record<string, unknown>;
      expressionContext: Array<{ name: string }>;
      secureMode: { nativeCapabilitiesDenied: string[]; policyGatedApi: string[] };
      componentState: string;
    };

    expect(schema.properties.layout.$ref).toBe("#/$defs/layoutTree");
    expect(schema.properties.g.$ref).toBe("#/$defs/stateObject");
    expect(schema.$defs.layoutTree.propertyNames.$ref).toBe("#/$defs/componentKey");
    expect(schema.$defs.componentNode.properties.$if).toBeTruthy();
    expect(schema.$defs.componentNode.patternProperties["^\\$[A-Za-z_$][\\w$-]*$"]).toBeTruthy();
    expect(Object.keys(schema.$defs.components).sort()).toEqual([...publicComponentTypes].sort());

    expect(catalog.componentCount).toBe(publicComponentTypes.length);
    expect(catalog.components.map((component) => component.type).sort()).toEqual([...publicComponentTypes].sort());
    expect(catalog.components.every((component) => component.props && component.children && component.docs && component.jsonSchema && component.hash)).toBe(true);
    for (const component of catalog.components) {
      for (const [propName, prop] of Object.entries(component.props)) {
        expect(component.jsonSchema.properties[propName], `${component.type}.${propName}`).toBeTruthy();
        if (prop.dynamic) expect(component.jsonSchema.properties[`$${propName}`], `${component.type}.$${propName}`).toBeTruthy();
      }
    }

    expect(profile.readPipes).toBeTruthy();
    expect(profile.writePipes).toBeTruthy();
    expect(Object.keys(profile.structuralDirectives).sort()).toEqual(["$for", "$if", "$key"].sort());
    expect(profile.expressionContext.map((item) => item.name)).toEqual(expect.arrayContaining(["g", "std", "api", "$event"]));
    expect(profile.secureMode.nativeCapabilitiesDenied).toEqual(expect.arrayContaining(["fetch", "setTimeout", "WebSocket"]));
    expect(profile.secureMode.policyGatedApi).toEqual(expect.arrayContaining(["api.fetch", "api.setTimeout"]));
    expect(profile.componentState).toContain("component catalog state mode");
  });

  it("keeps conformance fixtures aligned with validation diagnostics", async () => {
    const build = createStandardArtifacts(await packageVersion(), "2026-01-01T00:00:00.000Z");
    const conformance = build.artifacts["slex-conformance.json"] as {
      fixtures: Array<{
        id: string;
        mode: "trusted" | "secure";
        source: string;
        expected: {
          ok: boolean;
          warnings?: Array<string | { code: string; path?: string; value?: string }>;
          diagnostic?: string;
        };
      }>;
    };

    expect(conformance.fixtures.length).toBeGreaterThanOrEqual(16);
    expect(conformance.fixtures.map((fixture) => fixture.id)).toEqual(expect.arrayContaining([
      "valid-full-envelope",
      "valid-bare-tree",
      "valid-state-only",
      "valid-dynamic-props",
      "valid-event-handler",
      "valid-loop-condition",
      "valid-stdlib",
      "valid-secure-api",
      "warning-unknown-component-prop",
      "warning-unknown-std-api",
      "warning-secure-native-timer-websocket",
    ]));
    for (const fixture of conformance.fixtures) {
      const result = validateSlexSource(fixture.source, { mode: fixture.mode });
      expect(result.schemaVersion, fixture.id).toBe(SLEX_SCHEMA_VERSION);
      expect(result.protocolVersion, fixture.id).toBe(SLEX_PROTOCOL_VERSION);
      expect(result.logicProfileVersion, fixture.id).toBe(SLEX_LOGIC_PROFILE_VERSION);
      expect(result.ok, fixture.id).toBe(fixture.expected.ok);
      if (fixture.expected.warnings) {
        const expectedWarnings = fixture.expected.warnings.map((warning) => typeof warning === "string" ? { code: warning } : warning);
        for (const expected of expectedWarnings) {
          expect(result.warnings, fixture.id).toEqual(expect.arrayContaining([expect.objectContaining(expected)]));
        }
      }
      if (!fixture.expected.ok) {
        expect(result).toMatchObject({ ok: false, diagnostic: { code: fixture.expected.diagnostic } });
      }
    }
  });
});
