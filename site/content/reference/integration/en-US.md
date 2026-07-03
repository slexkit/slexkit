---
title: Host Integration
category: Reference
status: ready
order: 40
summary: "MarkdownRuntimeHost, trusted and secure host integrations, Svelte custom hosts, Streamdown, Tiptap, Obsidian, and custom adapters."
slexkitRenderMode: component
---

# Host Integration

How to integrate SlexKit into Markdown renderers, chat hosts, document viewers, and custom platforms.

## Core concepts

### Artifact

An artifact is a group of Slex blocks belonging to the same document, message, or note. Hosts identify an artifact by an `artifactId` and group related blocks into one runtime domain.

In **trusted mode**, the runtime prefixes each block's namespace with the artifact ID to prevent cross-document state pollution. `disposeArtifact()` releases all namespace stores for that artifact.

In **secure mode**, all fences in one artifact are combined into a single sandbox iframe. The runtime maintains artifact slots, syncing rendered heights back to the original Markdown placeholder containers.

### Block

A block is a single Slex block: one renderable unit. It has:
- A source (Slex expression object or source string).
- A container element (where the rendered output goes).
- An optional `artifactId` (for grouping into an artifact).

### Cleanup

Every block mount returns a cleanup function. The host must call it when the block is removed. For artifact-level cleanup, call `disposeArtifact(artifactId)`. For global cleanup, call `disposeAll()`.

## MarkdownRuntimeHost

The `SlexKitMarkdownRuntimeHost` is the recommended API for Markdown-based hosts. It handles mode selection, artifact management, and block lifecycle.

```ts
import {
  createSlexKitMarkdownRuntimeHost,
  getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHost
} from "slexkit";
```

### Interface

```ts
type SlexKitMarkdownRuntimeHost = {
  configure(options: Partial<SlexKitMarkdownRuntimeOptions>): void;
  getMode(): "trusted" | "secure";
  mountBlock(block: SlexKitMarkdownBlock): () => void;
  disposeBlock(container: HTMLElement): void;
  disposeArtifact(artifactId: string): void;
  disposeAll(): void;
};

type SlexKitMarkdownBlock = {
  artifactId?: string;
  blockId?: string;
  source: SlexExpression | string;
  container: HTMLElement;
  stateOnly?: boolean;
  theme?: ThemeMode;
  dir?: MountOptions["dir"];
  labels?: MountOptions["labels"];
  executionMode?: MountOptions["executionMode"];
};

type SlexKitMarkdownRuntimeOptions = {
  mode?: "trusted" | "secure";
  policy?: HostRuntimePolicy;
  hostAdapter?: HostRuntimeAdapter;
  secureFrame?: boolean | SecureFrameOptions;
  theme?: ThemeMode;
  dir?: MountOptions["dir"];
  labels?: MountOptions["labels"];
  executionMode?: MountOptions["executionMode"];
};
```

`executionMode: "preview"` is for speculative renders of repaired streaming prefixes. In preview mode, trusted mounts render readable UI but freeze write handlers, component emits, lifecycle hooks, and `api.*` capabilities. Blocks can override a host-level default by passing `executionMode` directly to `mountBlock()`.

### Global singleton

The module provides a global singleton for convenience:

```ts
// Install explicitly
const runtime = installSlexKitMarkdownRuntimeHost({
  mode: "secure",
  policy: { execution: { maxUnresponsiveMs: 30000 } },
  secureFrame: { runtimeUrl: "/slexkit.runtime.js" }
});

// Or use lazy global (auto-creates with defaults on first call)
const runtime = getSlexKitMarkdownRuntimeHost();
```

Use the singleton when the entire application shares one runtime configuration. Avoid it when different host contexts need different policies.

## Trusted mode integration

Trusted mode runs Slex source in the host page realm. Use for local documents, application-generated content, or reviewed Slex source.

```ts
const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "trusted",
  theme: "host-shadcn"
});

// Detect a slex fence at position <container>
const cleanup = runtime.mountBlock({
  artifactId: "doc-1",
  source: fenceSource,
  container: fenceContainer
});

// When the fence container is removed
runtime.disposeBlock(fenceContainer);

// When the document is closed
runtime.disposeArtifact("doc-1");

// When the plugin or page unloads
runtime.disposeAll();
```

In trusted mode, the runtime automatically scopes namespaces by artifact ID (`<artifactId>::<namespace>`) to prevent different documents from polluting each other's state.

State-only blocks (no `layout`, only `g` updates) are detected automatically and ingested via `ingest()`. Subsequent renderable blocks in the same artifact can read that state.

## Secure mode integration

Secure mode runs Slex source in a sandbox iframe. Use for untrusted or agent-generated Markdown.

```ts
const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "secure",
  policy: {
    execution: { maxUnresponsiveMs: 30000 }
  },
  secureFrame: {
    runtimeUrl: "/slexkit.runtime.js"
  },
  theme: "host-shadcn"
});

const cleanup = runtime.mountBlock({
  artifactId: "agent-msg-1",
  source: agentGeneratedDsl,
  container: fenceContainer
});
```

Omitted capability policies deny access by default. Add `network`, `timer`, `animation`, or `canvas` policy objects only when the host intentionally enables those capabilities.

### Artifact slot bridge

When multiple secure blocks belong to the same artifact, they share one sandbox iframe. The first block (in document order) becomes the iframe anchor. Other blocks act as slots; their containers receive position and height updates from the sandbox via the postMessage bridge.

```html
<!-- In Markdown, the first fence becomes the anchor -->
<div id="fence-1"><!-- anchor: iframe rendered here --></div>
<div id="fence-2"><!-- slot: height synced from iframe --></div>
<div id="fence-3"><!-- slot: height synced from iframe --></div>
```

This allows state sharing across fences within one artifact while keeping all execution confined to one sandbox.

### `runtimeUrl` requirements

The `runtimeUrl` must serve the SlexKit runtime as an ES module with:

```
Access-Control-Allow-Origin: *
Content-Type: text/javascript
```

The build output includes `dist/runtime.js` for this purpose. The `slex copy-runtime` command copies that module to `public/slexkit.runtime.js` by default so existing secure-frame URLs can stay stable. Configure the CDN or static file server to serve it with the correct headers.

## Svelte custom Markdown host

The SlexKit website uses Svelte plus a custom Markdown renderer instead of a packaged Svelte Markdown adapter. The public contract is still `createSlexKitMarkdownRuntimeHost`; the Svelte pieces are host code.

```js
import { mount, unmount } from "svelte";
import { createSlexKitMarkdownRuntimeHost } from "slexkit";
import MarkdownRenderer from "./MarkdownRenderer.svelte";

export function renderMarkdown(content, container, options = {}) {
  const runtimeHost = options.slexkitRuntimeHost ?? createSlexKitMarkdownRuntimeHost({
    mode: options.runtimeMode ?? "trusted",
    theme: "host-shadcn"
  });

  const app = mount(MarkdownRenderer, {
    target: container,
    props: {
      content,
      runtimeHost,
      artifactId: options.artifactId,
      slexkitRenderMode: options.slexkitRenderMode ?? "component"
    }
  });

  return () => unmount(app);
}
```

Use this as an implementation reference when the host owns its Markdown AST or Svelte renderer. Do not treat `site/markdown/*` as a separately versioned package API.

## Streamdown / React integration

The `@slexkit/streamdown` package provides a React/Streamdown custom renderer:

```tsx
import { Streamdown } from "streamdown";
import { slexkitRenderer } from "@slexkit/streamdown";
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/streamdown/style.css";

export function Message({ markdown }: { markdown: string }) {
  return (
    <Streamdown plugins={{ renderers: [slexkitRenderer] }}>
      {markdown}
    </Streamdown>
  );
}
```

The renderer handles `slex` fences. It supports both trusted and secure runtime modes and can delegate to a shared Markdown runtime host instance.

During token streaming, `streaming="repair"` is the default for trusted renders. A parseable source mounts immediately; a source missing only EOF closing tokens mounts as preview; uncertain prefixes stay on the placeholder; clear syntax errors still render diagnostics. Use `streaming="stable"` to render only already-parseable prefixes, or `streaming={false}` to wait for the closing fence. Secure runtime and secure runtime-host renders do not execute repaired prefixes in the host realm.

## Tiptap integration

The `@slexkit/tiptap` package provides a framework-free Tiptap `CodeBlock` extension:

```ts
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { createSlexKitTiptapExtension } from "@slexkit/tiptap";
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/tiptap/style.css";

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  Markdown,
  createSlexKitTiptapExtension({ artifactId: "doc-1" })
];
```

The adapter only takes over `codeBlock` nodes with `language === "slex"`. Non-Slex code blocks remain ordinary Tiptap code blocks, and Markdown import/export keeps standard ` ```slex ` fences through Tiptap's Markdown extension.

Each editor instance gets one trusted Markdown runtime host by default. Blocks in that editor share an artifact ID, so state-only fences can seed later renderable fences. Pass `runtimeHost` or `artifactId` when the host needs explicit lifecycle ownership.

## Obsidian integration

The official Obsidian plugin lives in <https://github.com/slexkit/obsidian-slexkit> and registers the `slex` fenced code block processor:

```ts
// In the plugin:
registerMarkdownCodeBlockProcessor("slex", (source, el, ctx) => { ... });
```

The adapter renders blocks in **reading mode only** and does not write back to the vault. Blocks within the same note share a trusted artifact runtime.

**Important**: The Obsidian adapter uses trusted mode because it renders content from the user's local vault. It is not designed as a security boundary for untrusted or agent-generated Markdown.

## Writing a custom host adapter

To integrate SlexKit into a custom Markdown renderer or chat host:

### 1. Detect fence language

Only process fences tagged with `slex`. Never scan plain JavaScript, JSON, or untagged code blocks.

### 2. Create a runtime host

```ts
import { createSlexKitMarkdownRuntimeHost } from "slexkit";

const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "trusted",   // or "secure"
  theme: "host-shadcn"
});
```

### 3. Mount blocks

For each detected fence, create a container element and mount:

```ts
function processFence(source: string, fenceIndex: number) {
  const container = document.createElement("div");
  // Insert container at the fence position in the document

  const cleanup = runtime.mountBlock({
    artifactId: "message-42",
    source,
    container
  });

  return cleanup;
}
```

### 4. Manage lifecycle

```ts
// When a single block is removed
runtime.disposeBlock(container);

// When the entire artifact (message/document) is removed
runtime.disposeArtifact("message-42");

// When the plugin/page unloads
runtime.disposeAll();
```

### 5. Handle secure mode

If using secure mode, serve `slexkit.runtime.js` as a public ES module with the correct CORS headers, and configure `secureFrame.runtimeUrl`.

## Fallback rendering

SlexKit-capable hosts should still include the raw fence content or a plain text fallback in the DOM for environments that don't support SlexKit. The runtime replaces the container children, so fallback text is only visible before mount or after disposal.
