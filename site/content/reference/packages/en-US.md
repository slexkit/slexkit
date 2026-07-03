---
title: Packages
category: Reference
status: ready
order: 60
summary: "SlexKit npm package roles, install combinations, publish contents, and release checks."
slexkitRenderMode: component
---

# Packages

SlexKit v0/beta package references list npm packages, install commands, and release checks.

## Package Map

```
slexkit (root package)
 ├── runtime entry
 ├── Svelte component registrations
 ├── ToolHost
 ├── default styles
 └── secure iframe runner

 @slexkit/runtime ─── re-exports slexkit/runtime
 @slexkit/components-svelte ─── re-exports slexkit/components-svelte
 @slexkit/theme-shadcn ─── CSS only
 @slexkit/streamdown ─── React/Streamdown renderer
 @slexkit/assistant-ui ─── assistant-ui Streamdown text wrapper
 @slexkit/tiptap ─── framework-free Tiptap NodeView adapter
 @slexkit/mcp ─── read-only MCP server for AI agents
```

`@slexkit/runtime` and `@slexkit/components-svelte` are published npm packages, but their code wraps the root `slexkit` package. They are not independent implementation packages; installing them still requires installing `slexkit`. `@slexkit/theme-shadcn` is CSS-only and contains no runtime implementation.

## slexkit (root)

The main implementation package. It contains the runtime engine, official Svelte components, ToolHost, and styles.

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

`slex validate --standard` runs the bundled Slex conformance fixtures against the validator shipped with the package. Use `--json` for CI or agent consumption.

## @slexkit/runtime

Component-free runtime entry point. Does not auto-register any official Svelte components.

```sh
npm install slexkit @slexkit/runtime
```

```js
import { mount, register, createSecureRuntime } from "@slexkit/runtime";
```

Use this to register a custom component set instead of the bundled Svelte components.

## @slexkit/components-svelte

Side-effect import that registers all official Svelte components into the runtime registry.

```sh
npm install slexkit @slexkit/runtime @slexkit/components-svelte
```

```js
import { mount } from "@slexkit/runtime";
import "@slexkit/components-svelte";
```

Public component specs: action (1), component (1), content (6), data (1), disclosure (2), display (3), feedback (2), input (6), layout (4), navigation (1), tooling (3).

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

## @slexkit/assistant-ui

assistant-ui message text wrapper for SlexKit fences. It delegates Markdown rendering to `@assistant-ui/react-streamdown` and only overrides the `slex` language block with `@slexkit/streamdown`.

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown @slexkit/assistant-ui @assistant-ui/react @assistant-ui/react-streamdown streamdown react react-dom
```

```tsx
import { MessagePrimitive } from "@assistant-ui/react";
import { SlexKitAssistantStreamdownText } from "@slexkit/assistant-ui";
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/assistant-ui/style.css";

export function AssistantMessage() {
  return (
    <MessagePrimitive.Parts>
      {({ part }) =>
        part.type === "text" ? (
          <SlexKitAssistantStreamdownText
            artifactId="message-1"
            secureFrame={{ runtimeUrl: "/slexkit.runtime.js" }}
          />
        ) : null
      }
    </MessagePrimitive.Parts>
  );
}
```

The runtime defaults to secure. assistant-ui tool calls and ToolHost flows still use their own integration layers.

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

The extension only takes over code blocks whose language is `slex`; ordinary code blocks stay native to Tiptap. It uses a trusted Markdown runtime host unless configured otherwise. Add `@tiptap/markdown` when loading or exporting Markdown.

## Obsidian plugin

The official Obsidian plugin lives in a separate release repository: <https://github.com/slexkit/obsidian-slexkit>.

Install **SlexKit** through Obsidian Community Plugins for normal vault use. Use BRAT or manual GitHub release assets only when testing unreleased builds from `slexkit/obsidian-slexkit`.

The community plugin is marked desktop-only and compatible with Obsidian 1.5.0+.

The plugin treats the user's local vault as trusted and uses trusted runtime mode. Do not use it as a sandbox for third-party or agent-generated Markdown; the v0 adapter does not include secure sandbox support.

## @slexkit/mcp

Read-only MCP server for AI agents. It serves generated LLM docs, component metadata, examples, runtime docs, ToolHost docs, and Slex source validation.

```sh
npx -y @slexkit/mcp
```

The server does not modify project files. Use it when an agent needs SlexKit component or runtime context.

## Installation matrix

| Use case | Install command |
|----------|----------------|
| Quick start, everything included | `npm install slexkit` |
| Component-free, custom components | `npm install slexkit @slexkit/runtime` |
| With Svelte components | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` |
| Add shadcn theme | `npm install @slexkit/theme-shadcn` |
| React/Streamdown host | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` |
| assistant-ui host | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown @slexkit/assistant-ui @assistant-ui/react @assistant-ui/react-streamdown streamdown react react-dom` |
| Tiptap editor host | `npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown` |
| Obsidian plugin | Install **SlexKit** from Obsidian Community Plugins |
| AI agent MCP server | `npx -y @slexkit/mcp` |

## v0 Package Layout

In v0, the root `slexkit` package carries the main implementation. Scoped `@slexkit/*` packages provide clearer install entry points. If these become physical packages later, source code, build output, and publish workflows need to split together.

## Release Check

Check all scoped packages together before publishing:

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
