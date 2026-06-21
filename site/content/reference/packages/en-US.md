---
title: Package Boundaries
category: Reference
status: ready
order: 60
summary: "Package relationships, installation matrix, publish contents, and release quality gates."
slexkitRenderMode: component
---

# Package Boundaries

SlexKit v0/beta npm packages, their relationships, and installation.

## Package relationship

```
slexkit (root - real code)
 ├── runtime entry
 ├── Svelte component registrations
 ├── ToolHost
 ├── default styles
 └── secure iframe runner

 @slexkit/runtime (thin wrapper) ─── re-exports slexkit/runtime
 @slexkit/components-svelte (thin wrapper) ─── re-exports slexkit/components-svelte
 @slexkit/theme-shadcn ─── CSS only
 @slexkit/streamdown ─── React/Streamdown renderer
 @slexkit/tiptap ─── framework-free Tiptap NodeView adapter
 @slexkit/mcp ─── read-only MCP server for AI agents
```

`@slexkit/runtime` and `@slexkit/components-svelte` are published npm packages, but their code is a thin wrapper around the root `slexkit` package. They are not independent implementation packages; installing them still requires installing `slexkit`. `@slexkit/theme-shadcn` is CSS-only and contains no runtime implementation.

## slexkit (root)

The actual implementation package. Contains the runtime engine, official Svelte components, ToolHost, and styles.

```sh
npm install slexkit
```

```js
import { mount, disposeNamespace, boot } from "slexkit";
import "slexkit/style.css";       // default styles (includes all component CSS)
```

`slexkit/dist/style.css` is a compatibility alias for the same distributed CSS bundle; do not import both paths.

Version helpers are exported from both the root and runtime entries:

```js
import { SLEXKIT_VERSION, SLEX_PROTOCOL_VERSION, getSlexKitInfo } from "slexkit";
```

The root package also ships the `slex` CLI:

```sh
slex copy-runtime public/slexkit.runtime.js
slex validate ./artifact.slex --mode secure
slex validate --standard
```

`slex validate --standard` runs the bundled Slex conformance fixtures against the current validator. Use `--json` for CI or agent consumption.

## @slexkit/runtime

Component-free runtime entry point. Does not auto-register any official Svelte components.

```sh
npm install slexkit @slexkit/runtime
```

```js
import { mount, register, createSecureRuntime } from "@slexkit/runtime";
```

Use this when you want to register your own component set instead of the bundled Svelte components.

## @slexkit/components-svelte

Side-effect import that registers all official Svelte components into the runtime registry.

```sh
npm install slexkit @slexkit/runtime @slexkit/components-svelte
```

```js
import { mount } from "@slexkit/runtime";
import "@slexkit/components-svelte";
```

Public component specs: action (2), component capability (1), content (6), data (1), disclosure (2), display (2), feedback (2), input (6), layout (4), navigation (1), tooling (1).

## @slexkit/theme-shadcn

CSS theme bundle (shadcn/ui compatible).

```sh
npm install @slexkit/theme-shadcn
```

```js
import "@slexkit/theme-shadcn/style.css";
```

## @slexkit/streamdown

React/Streamdown custom renderer for Markdown-hosted SlexKit fences.

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom
```

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

Processes `slex` fences. Supports both trusted and secure runtime modes.

## @slexkit/tiptap

Tiptap extension for rendering explicit `slex` code blocks as SlexKit previews while preserving normal fenced code block Markdown roundtrip.

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown
```

```ts
import StarterKit from "@tiptap/starter-kit";
import { createSlexKitTiptapExtension } from "@slexkit/tiptap";
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/tiptap/style.css";

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  createSlexKitTiptapExtension({ artifactId: "doc-1" })
];
```

The adapter extends Tiptap's `CodeBlock`, only takes over blocks whose language is exactly `slex`, keeps ordinary code blocks native, and uses a trusted Markdown runtime host by default. Add `@tiptap/markdown` when loading or exporting Markdown.

## Obsidian plugin

The official Obsidian plugin lives in a separate release repository: <https://github.com/slexkit/obsidian-slexkit>.

Install **SlexKit** through Obsidian Community Plugins for normal vault use. Use BRAT or manual GitHub release assets only when testing unreleased builds from `slexkit/obsidian-slexkit`.

The community plugin is currently desktop-only and compatible with Obsidian 1.5.0+. Mobile support should be enabled only after real mobile vault testing.

The adapter uses trusted runtime mode - it renders content from the user's local vault and is not designed as a sandbox for third-party or agent-generated Markdown. Secure sandbox support is not part of the v0 adapter.

## @slexkit/mcp

Read-only MCP server for AI agents. It serves generated LLM docs, component metadata, examples, runtime docs, ToolHost docs, and Slex source validation.

```sh
npx -y @slexkit/mcp
```

The server does not modify project files. Use it when an agent needs current SlexKit component or runtime context.

## Installation matrix

| Use case | Install command |
|----------|----------------|
| Quick start, everything included | `npm install slexkit` |
| Component-free, custom components | `npm install slexkit @slexkit/runtime` |
| With Svelte components | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` |
| Add shadcn theme | `npm install @slexkit/theme-shadcn` |
| React/Streamdown host | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` |
| Tiptap editor host | `npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown` |
| Obsidian plugin | Install **SlexKit** from Obsidian Community Plugins |
| AI agent MCP server | `npx -y @slexkit/mcp` |

## v0 packaging strategy

The current approach keeps the root `slexkit` package as the real code carrier. Scoped `@slexkit/*` wrappers exist to define future package boundaries. If physical package splitting happens in the future, it will involve splitting source code, build output, and publishing workflows.

## Release quality gate

All scoped packages are release-checked together:

```sh
bun run build
bun run test
bun run lint
bun run smoke:release
npm pack --dry-run --json
slex validate --standard --json
```

The release smoke packs and installs every scoped package in this repository, verifies public entry points, verifies CSS subpath exports, runs the installed `slex validate --standard --json`, and starts the MCP stdio binary to check `initialize`, `tools/list`, and `slexkitValidate`.

Before publishing, check that `npm pack --dry-run --json` includes `dist/standard/*` and `scripts/cli.mjs`. Standard artifacts must match `package.json`, `SLEX_PROTOCOL_VERSION`, and the bundled conformance fixtures.
