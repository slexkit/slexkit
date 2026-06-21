import { componentSpecs, publicComponentTypes } from "../components/spec-registry";
import {
  slexkitExpressionContext,
  slexkitRuntimeCapabilities,
  slexkitRuntimeCapabilityNames,
  slexkitStdlibDocs,
  slexkitStdlibFunctionNames,
} from "../engine/capabilities";
import { SLEX_PROTOCOL_VERSION } from "../version";

export const SLEX_SCHEMA_VERSION = "2026-06";
export const SLEX_LOGIC_PROFILE_VERSION = "0.1";

export const SLEX_STANDARD_ARTIFACTS = [
  "slex-expression.schema.json",
  "slex-component-catalog.json",
  "slex-logic-profile.json",
  "slex-capabilities.catalog.json",
  "slex-conformance.json",
  "slex-standard-manifest.json",
] as const;

export type SlexStandardArtifactFilename = (typeof SLEX_STANDARD_ARTIFACTS)[number];

export const slexReservedContextNames = [
  "g",
  "std",
  "api",
  "$event",
  "$item",
  "$index",
  "$key",
] as const;

export const slexNativeSecureCapabilities = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
] as const;

export type SlexStandardBuild = {
  files: Record<SlexStandardArtifactFilename, string>;
  artifacts: Record<SlexStandardArtifactFilename, unknown>;
};

export function hashStandardText(source: string): string {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function componentHash(value: unknown): string {
  return hashStandardText(JSON.stringify(value));
}

function propJsonSchema(prop: { type: string; values?: readonly string[]; description: string; default?: unknown }) {
  if (prop.values?.length) {
    return {
      enum: [...prop.values],
      description: prop.description,
      default: prop.default,
    };
  }

  const typeMap: Record<string, unknown> = {
    string: { type: "string" },
    number: { type: "number" },
    boolean: { type: "boolean" },
    array: { type: "array" },
    "string[]": { type: "array", items: { type: "string" } },
    "string | number": { type: ["string", "number"] },
    "string | string[]": {
      anyOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } },
      ],
    },
    "object | string": {
      anyOf: [
        { type: "object", additionalProperties: true },
        { type: "string" },
      ],
    },
    "write-expression": { type: "string", xSlexkitExpressionKind: "write" },
  };

  return {
    ...(typeMap[prop.type] ?? { description: `SlexKit prop type '${prop.type}'.` }),
    description: prop.description,
    default: prop.default,
  };
}

function componentPropSchema(spec: (typeof componentSpecs)[number]) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [name, prop] of Object.entries(spec.props)) {
    properties[name] = propJsonSchema(prop);
    if (prop.dynamic) {
      properties[`$${name}`] = {
        type: "string",
        description: `Dynamic expression for '${name}'. Evaluated with the Slex logic profile.`,
        xSlexkitExpressionKind: "read",
      };
    }
    if (prop.required) required.push(name);
  }

  return {
    type: "object",
    additionalProperties: true,
    properties,
    required,
    patternProperties: {
      "^[a-z][a-z0-9-]*:[A-Za-z0-9_$-]*$": { $ref: "#/$defs/componentNode" },
      "^on[A-Za-z_$][\\w$-]*$": {
        type: "string",
        description: "Write-pipe event handler expression.",
        xSlexkitExpressionKind: "write",
      },
    },
  };
}

function expressionSchema(packageVersion: string) {
  const componentKeyPattern = "^[a-z][a-z0-9-]*:[A-Za-z0-9_$-]*$";
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://slexkit.dev/standard/slex-expression.schema.json",
    title: "Slex Expression",
    description:
      "Structural schema for SlexKit logic-bearing Markdown UI artifacts. JavaScript expression semantics are defined by slex-logic-profile.json.",
    type: "object",
    additionalProperties: true,
    properties: {
      slex: {
        type: "string",
        const: SLEX_PROTOCOL_VERSION,
        description: "Optional public Slex protocol marker.",
      },
      namespace: {
        type: "string",
        minLength: 1,
        description: "State namespace. Bare component trees default to namespace 'default'.",
      },
      g: {
        $ref: "#/$defs/stateObject",
      },
      layout: {
        $ref: "#/$defs/layoutTree",
        description: "Component tree keyed by 'type:identifier'.",
      },
    },
    patternProperties: {
      [componentKeyPattern]: {
        $ref: "#/$defs/componentNode",
      },
    },
    $defs: {
      componentKey: {
        type: "string",
        pattern: componentKeyPattern,
      },
      directive: {
        type: "string",
        description: "$if, $for, and $key directive expressions are JavaScript expression strings.",
      },
      readPipe: {
        type: "string",
        description: "JavaScript expression evaluated against g, std, api, component state, and loop context.",
        xSlexkitExpressionKind: "read",
      },
      writePipe: {
        type: "string",
        description: "JavaScript statements executed with $event and the Slex expression context.",
        xSlexkitExpressionKind: "write",
      },
      stateObject: {
        type: "object",
        additionalProperties: true,
        description: "Mutable artifact state and helper functions. Source form may contain JavaScript functions.",
      },
      layoutTree: {
        type: "object",
        propertyNames: { $ref: "#/$defs/componentKey" },
        additionalProperties: { $ref: "#/$defs/componentNode" },
      },
      componentNode: {
        type: "object",
        additionalProperties: true,
        properties: {
          $if: { $ref: "#/$defs/directive" },
          $for: { $ref: "#/$defs/directive" },
          $key: { $ref: "#/$defs/directive" },
        },
        patternProperties: {
          "^\\$[A-Za-z_$][\\w$-]*$": { $ref: "#/$defs/readPipe" },
          "^on[A-Za-z_$][\\w$-]*$": { $ref: "#/$defs/writePipe" },
          [componentKeyPattern]: { $ref: "#/$defs/componentNode" },
        },
      },
      components: Object.fromEntries(componentSpecs.map((spec) => [spec.type, componentPropSchema(spec)])),
    },
    xSlexkit: {
      packageVersion,
      schemaVersion: SLEX_SCHEMA_VERSION,
      protocolVersion: SLEX_PROTOCOL_VERSION,
      logicProfileVersion: SLEX_LOGIC_PROFILE_VERSION,
      sourceFormat: "JavaScript object literal embedded in explicit Markdown ```slex fences",
    },
  };
}

function componentCatalog(packageVersion: string) {
  return {
    name: "slex-component-catalog",
    packageName: "slexkit",
    version: packageVersion,
    schemaVersion: SLEX_SCHEMA_VERSION,
    protocolVersion: SLEX_PROTOCOL_VERSION,
    componentCount: publicComponentTypes.length,
    components: componentSpecs.map((spec) => ({
      type: spec.type,
      category: spec.category,
      status: spec.status,
      state: spec.state,
      since: spec.since,
      title: spec.title,
      summary: spec.summary,
      description: spec.description,
      props: spec.props,
      children: spec.children,
      examples: spec.examples,
      docs: spec.docs,
      jsonSchema: componentPropSchema(spec),
      hash: componentHash(spec),
    })),
  };
}

function logicProfile(packageVersion: string) {
  return {
    name: "slex-logic-profile",
    packageName: "slexkit",
    version: packageVersion,
    profileVersion: SLEX_LOGIC_PROFILE_VERSION,
    schemaVersion: SLEX_SCHEMA_VERSION,
    protocolVersion: SLEX_PROTOCOL_VERSION,
    positioning:
      "Slex is a Markdown-native logic-bearing UI artifact: component structure is declarative, while local state and interaction logic are expressed through a constrained JavaScript expression profile.",
    sourceFormat: {
      fenceLanguage: "slex",
      acceptedForms: ["Slex expression envelope", "bare component tree shorthand", "state-only envelope"],
      plainJsonOnly: false,
    },
    readPipes: {
      match: "Component prop keys beginning with '$', excluding structural directives.",
      valueType: "string",
      semantics: "Evaluated as JavaScript expressions with access to the Slex expression context.",
    },
    writePipes: {
      match: "Component prop keys beginning with 'on'.",
      valueType: "string",
      semantics: "Executed as JavaScript statements. $event contains the emitted event data.",
    },
    structuralDirectives: {
      $if: { valueType: "string", semantics: "Controls component existence." },
      $for: { valueType: "string", semantics: "Iterates over array-like values." },
      $key: { valueType: "string", semantics: "Provides the keyed reconciliation strategy for $for." },
    },
    expressionContext: slexkitExpressionContext,
    reservedContextNames: [...slexReservedContextNames],
    componentState:
      "Named components expose state according to their component catalog state mode: value, checked, enabled, readable, or none.",
    secureMode: {
      nativeCapabilitiesDenied: [...slexNativeSecureCapabilities],
      policyGatedApi: slexkitRuntimeCapabilityNames,
      guidance: "Use policy-gated api.* capabilities in secure mode; do not call native browser capabilities directly.",
    },
    diagnostics: [
      "unsupported_protocol",
      "invalid_component_key",
      "invalid_directive_type",
      "unknown_component",
      "unknown_prop",
      "unknown_std_member",
      "unknown_api_member",
      "native_secure_capability",
      "reserved_context_shadowing",
    ],
  };
}

function capabilitiesCatalog(packageVersion: string) {
  return {
    name: "slex-capabilities-catalog",
    packageName: "slexkit",
    version: packageVersion,
    schemaVersion: SLEX_SCHEMA_VERSION,
    protocolVersion: SLEX_PROTOCOL_VERSION,
    expressionContext: slexkitExpressionContext,
    stdlib: slexkitStdlibDocs,
    stdlibFunctionNames: slexkitStdlibFunctionNames,
    apiCapabilities: slexkitRuntimeCapabilities,
    apiCapabilityNames: slexkitRuntimeCapabilityNames,
    secureNativeCapabilitiesDenied: [...slexNativeSecureCapabilities],
  };
}

function conformance(packageVersion: string) {
  return {
    name: "slex-conformance",
    packageName: "slexkit",
    version: packageVersion,
    schemaVersion: SLEX_SCHEMA_VERSION,
    protocolVersion: SLEX_PROTOCOL_VERSION,
    logicProfileVersion: SLEX_LOGIC_PROFILE_VERSION,
    fixtures: [
      {
        id: "valid-full-envelope",
        kind: "valid",
        mode: "trusted",
        source:
          '{ slex: "0.1", namespace: "valid_full", g: { count: 0 }, layout: { "button:add": { label: "Add", onclick: "g.count++" }, "text:value": { "$text": "String(g.count)" } } }',
        expected: { ok: true, warnings: [] },
      },
      {
        id: "valid-dynamic-props",
        kind: "valid",
        mode: "trusted",
        source:
          '{ slex: "0.1", namespace: "dynamic_props", g: { name: "Slex" }, layout: { "text:greeting": { "$text": "\'Hello, \' + g.name" } } }',
        expected: { ok: true, warnings: [] },
      },
      {
        id: "valid-event-handler",
        kind: "valid",
        mode: "trusted",
        source:
          '{ slex: "0.1", namespace: "event_handler", g: { count: 0 }, layout: { "button:add": { label: "Add", onclick: "g.count = g.count + Number($event || 1)" } } }',
        expected: { ok: true, warnings: [] },
      },
      {
        id: "valid-loop-condition",
        kind: "valid",
        mode: "trusted",
        source:
          '{ slex: "0.1", namespace: "loop_condition", g: { visible: true, items: [{ id: "a", label: "A" }] }, layout: { "column:list": { "$if": "g.visible", "text:item": { "$for": "g.items", "$key": "$item.id", "$text": "$item.label" } } } }',
        expected: { ok: true, warnings: [] },
      },
      {
        id: "valid-stdlib",
        kind: "valid",
        mode: "trusted",
        source:
          '{ slex: "0.1", namespace: "stdlib", g: { done: 3, total: 4 }, layout: { "stat:progress": { label: "Progress", "$value": "std.format.percent(std.math.safeDivide(g.done, g.total), 1)" } } }',
        expected: { ok: true, warnings: [] },
      },
      {
        id: "valid-secure-api",
        kind: "valid",
        mode: "secure",
        source:
          '{ slex: "0.1", namespace: "secure_api", g: { status: "idle", async load() { const result = await api.fetch("/status"); this.status = String(result.status); } }, layout: { "button:load": { label: "Load", onclick: "g.load()" }, "text:status": { "$text": "g.status" } } }',
        expected: { ok: true, warnings: [] },
      },
      {
        id: "valid-bare-tree",
        kind: "valid",
        mode: "trusted",
        source: '{ "text:message": { text: "Bare tree" } }',
        expected: { ok: true, warnings: [] },
      },
      {
        id: "valid-state-only",
        kind: "valid",
        mode: "trusted",
        source: '{ slex: "0.1", namespace: "state_only", g: { ready: true } }',
        expected: { ok: true, warnings: [] },
      },
      {
        id: "warning-secure-native-capability",
        kind: "warning",
        mode: "secure",
        source:
          '{ slex: "0.1", namespace: "native_fetch", g: { load() { fetch("/x"); } }, layout: { "button:load": { label: "Load", onclick: "g.load()" } } }',
        expected: { ok: true, warnings: [{ code: "native_secure_capability", path: "g.load", value: "fetch" }] },
      },
      {
        id: "warning-secure-native-timer-websocket",
        kind: "warning",
        mode: "secure",
        source:
          '{ slex: "0.1", namespace: "native_timer_socket", g: { start() { setTimeout(() => {}, 10); const socket = new WebSocket("wss://example.com"); return socket; } }, layout: { "button:start": { label: "Start", onclick: "g.start()" } } }',
        expected: {
          ok: true,
          warnings: [
            { code: "native_secure_capability", path: "g.start", value: "WebSocket" },
            { code: "native_secure_capability", path: "g.start", value: "setTimeout" },
          ],
        },
      },
      {
        id: "warning-unknown-component-prop",
        kind: "warning",
        mode: "trusted",
        source: '{ namespace: "unknowns", layout: { "madeup:thing": { madeUp: true }, "text:body": { madeUp: true } } }',
        expected: {
          ok: true,
          warnings: [
            { code: "unknown_component", path: "layout.madeup:thing", value: "madeup" },
            { code: "unknown_prop", path: "layout.text:body.madeUp", value: "madeUp" },
          ],
        },
      },
      {
        id: "warning-invalid-component-key",
        kind: "warning",
        mode: "trusted",
        source: '{ namespace: "bad_key", layout: { "Text Bad:item": { text: "bad" } } }',
        expected: { ok: true, warnings: [{ code: "invalid_component_key", path: "layout.Text Bad:item", value: "Text Bad:item" }] },
      },
      {
        id: "warning-invalid-directive-type",
        kind: "warning",
        mode: "trusted",
        source: '{ namespace: "bad_directive", layout: { "text:message": { "$if": true, text: "bad" } } }',
        expected: { ok: true, warnings: [{ code: "invalid_directive_type", path: "layout.text:message.$if", value: "$if" }] },
      },
      {
        id: "warning-unsupported-protocol",
        kind: "warning",
        mode: "trusted",
        source: '{ slex: "9.9", namespace: "future", layout: { "text:message": { text: "future" } } }',
        expected: { ok: true, warnings: [{ code: "unsupported_protocol", path: "slex", value: "9.9" }] },
      },
      {
        id: "warning-reserved-context-shadowing",
        kind: "warning",
        mode: "trusted",
        source: '{ namespace: "shadow", g: { std: "bad" }, layout: { "text:api": { text: "shadow" } } }',
        expected: {
          ok: true,
          warnings: [
            { code: "reserved_context_shadowing", path: "g.std", value: "std" },
            { code: "reserved_context_shadowing", path: "layout.text:api", value: "api" },
          ],
        },
      },
      {
        id: "warning-unknown-std-api",
        kind: "warning",
        mode: "secure",
        source:
          '{ slex: "0.1", namespace: "unknown_logic", g: { load() { api.socket(); } }, layout: { "text:value": { "$text": "std.math.nope(1)" } } }',
        expected: {
          ok: true,
          warnings: [
            { code: "unknown_api_member", path: "g.load", value: "api.socket" },
            { code: "unknown_std_member", path: "layout.text:value.$text", value: "std.math.nope" },
          ],
        },
      },
      {
        id: "invalid-syntax",
        kind: "invalid",
        mode: "trusted",
        source: '{ namespace: "broken", layout: { "text:message": { text: "missing close" }',
        expected: { ok: false, diagnostic: "syntax" },
      },
    ],
  };
}

export function createStandardArtifacts(packageVersion: string, generatedAt = new Date().toISOString()): SlexStandardBuild {
  const artifacts = {
    "slex-expression.schema.json": expressionSchema(packageVersion),
    "slex-component-catalog.json": componentCatalog(packageVersion),
    "slex-logic-profile.json": logicProfile(packageVersion),
    "slex-capabilities.catalog.json": capabilitiesCatalog(packageVersion),
    "slex-conformance.json": conformance(packageVersion),
  } as Omit<Record<SlexStandardArtifactFilename, unknown>, "slex-standard-manifest.json">;

  const artifactMetadata = Object.fromEntries(
    Object.entries(artifacts).map(([filename, artifact]) => [
      filename,
      {
        path: `/standard/${filename}`,
        hash: hashStandardText(stableJson(artifact)),
      },
    ]),
  );

  const manifest = {
    name: "slex-standard-manifest",
    packageName: "slexkit",
    version: packageVersion,
    schemaVersion: SLEX_SCHEMA_VERSION,
    protocolVersion: SLEX_PROTOCOL_VERSION,
    logicProfileVersion: SLEX_LOGIC_PROFILE_VERSION,
    generatedAt,
    positioning: "Markdown-native logic-bearing UI artifact",
    compatibility: {
      keepsJavaScriptExpressionProfile: true,
      pureJsonUiProtocol: false,
      a2uiBridgePlanned: true,
    },
    artifacts: artifactMetadata,
  };

  const allArtifacts = {
    ...artifacts,
    "slex-standard-manifest.json": manifest,
  } as Record<SlexStandardArtifactFilename, unknown>;

  return {
    artifacts: allArtifacts,
    files: Object.fromEntries(
      SLEX_STANDARD_ARTIFACTS.map((filename) => [filename, stableJson(allArtifacts[filename])]),
    ) as Record<SlexStandardArtifactFilename, string>,
  };
}
