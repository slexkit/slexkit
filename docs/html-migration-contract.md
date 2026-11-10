# SlexKit HTML profile and migration contract

SlexKit 0.5 uses the `html-1` authoring profile. A `slex` Markdown fence is an HTML fragment string containing native HTML/SVG, documented `slex-*` custom elements, optional CSS, and optional inline JavaScript. Object-tree `g/layout` input, expression-string attributes, state-only source, and old-format fallback are not part of this profile.

This document is the durable compatibility contract for hosts migrating from the former expression format. Historical changelog entries may describe older protocols, but they do not define current behavior.

## Public entries and components

- `slexkit` and `slexkit/runtime` expose the HTML document runtime and static inspection APIs. Both accept source strings; object input is rejected.
- `slexkit/web-components` exposes `defineSlexElements(options)` and `describeSlexElements()`. Importing the standalone entry does not register elements automatically.
- `defineSlexElements()` registers 28 default elements in the selected window. Scalar initial values use attributes, arrays/objects use live JavaScript properties, interaction uses native events, and children use native slots.
- `slex-playground` is optional authoring UI, not one of the 28 default elements. Register it explicitly with `defineSlexPlayground(window, hostOptions)` from `slexkit/tooling`. Its `hostOptions` must identify the same isolated runtime assets used by other document hosts, normally through `secureFrame.runtimeUrl` and optional `secureFrame.styleUrl`.
- A standalone component host may let the component module load its adjacent stylesheet, set `stylesheetUrl`, or provide trusted `cssText`. These are host configuration values, never payload attributes. There are no public raw-source Svelte component entry exports.

`dist/custom-elements.json` is the authoritative element contract. The former DSL catalog is not a substitute for it.

## Document host

`createSlexKitMarkdownRuntimeHost(options)` returns:

```ts
type SlexKitMarkdownRuntimeHost = {
  configure(options: Partial<SlexKitMarkdownRuntimeOptions>): void;
  getMode(): "secure" | "trusted";
  mountBlock(block: SlexKitMarkdownBlock): () => void;
  disposeBlock(container: HTMLElement): void;
  disposeArtifact(artifactId: string): void;
  disposeAll(): void;
  updateArtifact(
    artifactId: string,
    blocks: readonly SlexKitMarkdownBlock[],
    options: { phase: "preview" | "commit"; reset?: boolean },
  ): Promise<void>;
  resetArtifact(artifactId: string): Promise<void>;
};

type SlexKitMarkdownBlock = {
  artifactId?: string;
  blockId?: string;
  namespace?: string;
  source: string;
  container: HTMLElement;
  theme?: string;
  dir?: "ltr" | "rtl" | "auto";
  executionMode?: "live" | "preview";
};
```

Every mounted block uses a separate sandboxed iframe/document. `mode: "trusted"` and `trusted: true` remain accepted compatibility inputs, but they do not enable inline host-page execution; `getMode()` reports `"secure"` and all payloads use the isolated path. Missing or failed runtime assets fail closed.

Hosts provide `secureFrame.runtimeUrl` and may provide `secureFrame.styleUrl`, `fontUrls`, and `imageUrls`; top-level aliases are also accepted. The root entry derives a default runtime URL from its own module URL. Assets loaded in an opaque-origin sandbox need appropriate CORS responses. A host using a `data:` runtime URL must also provide a resolvable style asset or set `styleUrl: false`.

`phase: "preview"` performs static inspection only and leaves the last committed document interactive. `phase: "commit"` applies a valid revision. Artifact updates require unique non-empty block IDs and containers. Stable block IDs plus matching element tags and stable `id`/`data-key` values preserve compatible DOM/component instances, visible control values, focus, and supported selection. Deleted or retyped nodes dispose. Reset reapplies source defaults. Changed scripts dispose their previous scope before replacement; arbitrary closure state is not preserved automatically.

`mount(source, container, options)` uses the same isolated document host and returns:

```ts
type HtmlMountHandle = (() => void) & {
  ready: Promise<void>;
  update(source: string, options?: { reset?: boolean }): Promise<void>;
  reset(): Promise<void>;
  snapshot(): Promise<unknown>;
};
```

## Guest JavaScript and state

Executable inline scripts run as modules, including scripts without a `type` attribute. Data-script types remain inert. Module imports and re-exports are rejected; the payload uses the document's global `slex` SDK:

- `slex.root`: the fragment root.
- `slex.signal`: an `AbortSignal` aborted before its module scope is replaced or disposed.
- `slex.onDispose(fn)`: cleanup for listeners, timers, observers, and other side effects.
- `slex.onSnapshot(fn)` and `slex.onRestore(fn)`: explicit persistence for hidden JavaScript state.
- `slex.api`: host-policy-gated operations.
- `slex.shared.get/set/subscribe`: bounded getter-free JSON state shared only by fences with the same artifact identity.

Each fence still has its own document and JavaScript globals. `slex.shared` transfers JSON values; it does not merge DOMs or module scopes and it is not a binding language.

Payload and component styles are installed as lifecycle-owned document styles and removed or replaced with the corresponding revision. The observable contract is correct style application and cleanup across commit, rollback, and disposal; hosts must not depend on a particular temporary URL or stylesheet implementation.

## Static inspection

```ts
declare function inspectSlexSource(source: unknown): HtmlInspectionResult;
declare const parseSlexSource: typeof inspectSlexSource;
declare function validateSlexSource(source: unknown): HtmlValidationResult;
```

These functions parse HTML and inline JavaScript without executing payload code and work without a browser DOM. They reject legacy object source, external scripts/imports, inline `on*` attributes, embedded frames/plugins, `<base>`, meta refresh, selected external `<link>` resources, and executable URL schemes. Parser recovery may produce warnings. Static validity is a syntax/policy result, not proof that code is safe to execute.

## Isolation and network limits

The iframe sandbox, content policy, authenticated message protocol, and host capability policy are layered controls. Host/guest messages validate the source window, channel token, request ID, revision, and payload shape so stale responses cannot overwrite a newer revision.

Browser conformance checks show payload `fetch`, image, font, external script, and external link resource loads—including nonce-bearing resources—denied in Chromium, Firefox, and WebKit. Approved network operations instead use the host-controlled `slex.api` bridge.

These controls are not a universal network-egress firewall. In all three engines, a payload can navigate its own sandboxed iframe with `location.href`, and that navigation can issue a network request. They are also not CPU preemption: parent code cannot reliably interrupt arbitrary infinite computation in the guest. Deployments handling hostile code need external browser/process network controls and timeouts in addition to SlexKit's document isolation.

## Protocol identity

The public authoring/profile identifier is `html-1` (`SLEX_PROTOCOL_VERSION`). The internal host/runner message channel is `slexkit-html-v1`. Neither identifier is the former `0.1` expression protocol.
