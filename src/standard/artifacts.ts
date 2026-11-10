import { describeSlexElements } from "../web-components/definitions";

export const SLEX_SCHEMA_VERSION = "2026-11-html";
export const SLEX_HTML_PROFILE_VERSION = "1";
/** Compatibility export for callers migrating from the expression profile. */
export const SLEX_LOGIC_PROFILE_VERSION = SLEX_HTML_PROFILE_VERSION;

export const SLEX_STANDARD_ARTIFACTS = [
  "slex-html-profile.json",
  "slex-custom-elements.catalog.json",
  "slex-sandbox-sdk.json",
  "slex-static-policy.json",
  "slex-html-conformance.json",
  "slex-standard-manifest.json",
] as const;

export type SlexStandardArtifactFilename = (typeof SLEX_STANDARD_ARTIFACTS)[number];
export const slexReservedContextNames = ["slex"] as const;
export const slexNativeSecureCapabilities = [
  "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker",
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

function htmlProfile(packageVersion: string) {
  return {
    name: "slex-html-profile",
    packageName: "slexkit",
    version: packageVersion,
    schemaVersion: SLEX_SCHEMA_VERSION,
    profileVersion: SLEX_HTML_PROFILE_VERSION,
    fenceLanguage: "slex",
    sourceType: "HTML fragment string",
    content: ["standard HTML", "SVG", "style", "documented slex-* custom elements", "inline module scripts"],
    rejectedLegacyForms: ["object g/layout envelope", "bare component tree", "state-only envelope", "expression-string attributes"],
    execution: "isolated frame; preview is static-only; commit may execute inline modules",
    hostOwned: ["runtimeUrl", "styleUrl", "component registration", "capability policy"],
    stableIdentity: ["blockId", "id", "data-key"],
  };
}

function componentCatalog(packageVersion: string) {
  const defaultElements = describeSlexElements().map((element) => ({
    ...element,
    availability: "default" as const,
    entrypoint: "slexkit/web-components",
  }));
  const elements = [
    ...defaultElements,
    {
      tagName: "slex-playground",
      properties: [
        { name: "source", attribute: "source", type: "string | number" },
        { name: "autorun", attribute: "autorun", type: "boolean" },
      ],
      slots: [],
      events: [],
      availability: "optional" as const,
      entrypoint: "slexkit/tooling",
    },
  ];
  return {
    name: "slex-custom-elements-catalog",
    packageName: "slexkit",
    version: packageVersion,
    schemaVersion: SLEX_SCHEMA_VERSION,
    generatedFrom: "src/web-components/definitions.ts",
    defaultComponentCount: defaultElements.length,
    optionalComponentCount: elements.length - defaultElements.length,
    componentCount: elements.length,
    elements,
  };
}

function sandboxSdk(packageVersion: string) {
  return {
    name: "slex-sandbox-sdk",
    packageName: "slexkit",
    version: packageVersion,
    global: "slex",
    members: {
      root: { kind: "Element", description: "Root of the current block document." },
      signal: { kind: "AbortSignal", description: "Aborted before the current module scope is replaced or disposed." },
      onDispose: { signature: "onDispose(fn)", description: "Release listeners and side effects before replacement/removal." },
      onSnapshot: { signature: "onSnapshot(fn)", description: "Return JSON-serializable hidden state." },
      onRestore: { signature: "onRestore(fn)", description: "Restore an explicit snapshot." },
      api: { kind: "policy-gated host bridge" },
      shared: { members: ["get", "set", "subscribe"], values: "JSON" },
    },
  };
}

function staticPolicy(packageVersion: string) {
  return {
    name: "slex-static-policy",
    packageName: "slexkit",
    version: packageVersion,
    inspectionExecutesSource: false,
    rejected: [
      "external scripts", "JavaScript imports", "inline event-handler attributes",
      "embedded frames/plugins", "base or navigation metadata", "executable URL schemes",
    ],
    nativeNetworkDefaults: "blocked",
    note: "Static validity is not a security boundary; generated code still runs in an isolated frame.",
  };
}

function conformance(packageVersion: string) {
  return {
    name: "slex-html-conformance",
    packageName: "slexkit",
    version: packageVersion,
    schemaVersion: SLEX_SCHEMA_VERSION,
    profileVersion: SLEX_HTML_PROFILE_VERSION,
    fixtures: [
      { id: "valid-native-html", kind: "valid", source: "<section><h2>Status</h2><p>Ready</p></section>", expected: { ok: true } },
      { id: "valid-custom-element", kind: "valid", source: "<slex-stat id=\"count\" label=\"Count\" value=\"3\"></slex-stat>", expected: { ok: true } },
      { id: "valid-inline-module", kind: "valid", source: "<button id=\"go\">Go</button><script type=\"module\">slex.root.querySelector('#go').textContent = 'Ready';</script>", expected: { ok: true } },
      { id: "valid-implicit-module", kind: "valid", source: "<output id=\"value\"></output><script>slex.root.querySelector('#value').textContent = '3';</script>", expected: { ok: true } },
      { id: "valid-data-script", kind: "valid", source: "<script type=\"application/json\">{\"rows\":[1,2]}</script>", expected: { ok: true } },
      { id: "valid-style-and-svg", kind: "valid", source: "<style>.ok{color:green}</style><svg viewBox=\"0 0 10 10\"><circle cx=\"5\" cy=\"5\" r=\"4\"></circle></svg>", expected: { ok: true } },
      { id: "invalid-object-source", kind: "invalid", source: "{ g: {}, layout: {} }", expected: { ok: false, diagnostic: "legacy-object-source" } },
      { id: "invalid-event-attribute", kind: "invalid", source: "<button onclick=\"run()\">Run</button>", expected: { ok: false, diagnostic: "inline-event-handler" } },
      { id: "invalid-external-script", kind: "invalid", source: "<script src=\"https://example.com/x.js\"></script>", expected: { ok: false, diagnostic: "external-script" } },
      { id: "invalid-module-import", kind: "invalid", source: "<script type=\"module\">import 'https://example.com/x.js';</script>", expected: { ok: false, diagnostic: "external-import" } },
      { id: "invalid-dynamic-import", kind: "invalid", source: "<script>void import('https://example.com/x.js');</script>", expected: { ok: false, diagnostic: "external-import" } },
      { id: "invalid-embedded-frame", kind: "invalid", source: "<iframe src=\"https://example.com\"></iframe>", expected: { ok: false, diagnostic: "active-embedded-content" } },
      { id: "invalid-executable-url", kind: "invalid", source: "<a href=\"javascript:alert(1)\">Run</a>", expected: { ok: false, diagnostic: "executable-url" } },
      { id: "invalid-base-element", kind: "invalid", source: "<base href=\"https://example.com/\"><p>Text</p>", expected: { ok: false, diagnostic: "base-element" } },
      { id: "invalid-meta-refresh", kind: "invalid", source: "<meta http-equiv=\"refresh\" content=\"0;url=https://example.com\">", expected: { ok: false, diagnostic: "meta-navigation" } },
      { id: "invalid-external-stylesheet", kind: "invalid", source: "<link rel=\"stylesheet\" href=\"https://example.com/x.css\">", expected: { ok: false, diagnostic: "external-resource" } },
      { id: "invalid-module-syntax", kind: "invalid", source: "<script>const = ;</script>", expected: { ok: false, diagnostic: "invalid-module-script" } },
    ],
  };
}

export function createStandardArtifacts(packageVersion: string, generatedAt = new Date().toISOString()): SlexStandardBuild {
  const artifactsWithoutManifest = {
    "slex-html-profile.json": htmlProfile(packageVersion),
    "slex-custom-elements.catalog.json": componentCatalog(packageVersion),
    "slex-sandbox-sdk.json": sandboxSdk(packageVersion),
    "slex-static-policy.json": staticPolicy(packageVersion),
    "slex-html-conformance.json": conformance(packageVersion),
  };
  const artifactMetadata = Object.fromEntries(Object.entries(artifactsWithoutManifest).map(([filename, artifact]) => [
    filename,
    { path: `/standard/${filename}`, hash: hashStandardText(stableJson(artifact)) },
  ]));
  const manifest = {
    name: "slex-standard-manifest",
    packageName: "slexkit",
    version: packageVersion,
    schemaVersion: SLEX_SCHEMA_VERSION,
    profileVersion: SLEX_HTML_PROFILE_VERSION,
    generatedAt,
    positioning: "HTML-first interactive Markdown artifact",
    compatibility: { legacyObjectSource: false, expressionAttributes: false },
    artifacts: artifactMetadata,
  };
  const artifacts = {
    ...artifactsWithoutManifest,
    "slex-standard-manifest.json": manifest,
  } as Record<SlexStandardArtifactFilename, unknown>;
  return {
    artifacts,
    files: Object.fromEntries(SLEX_STANDARD_ARTIFACTS.map((filename) => [filename, stableJson(artifacts[filename])])) as Record<SlexStandardArtifactFilename, string>,
  };
}
