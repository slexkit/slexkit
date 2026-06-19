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
 @slexkit/mcp ─── read-only MCP server for AI agents
```

`@slexkit/runtime` and `@slexkit/components-svelte` are thin wrappers that re-export from the root `slexkit` package. They are not standalone physical packages; installing them still requires installing `slexkit`. `@slexkit/theme-shadcn` is CSS-only and contains no runtime implementation.

## slexkit (root)

The actual implementation package. Contains the runtime engine, official Svelte components, ToolHost, and styles.

```sh
npm install slexkit
```

```js
import { mount, disposeNamespace, boot } from "slexkit";
import "slexkit/style.css";       // default styles (includes all component CSS)
import "slexkit/dist/style.css";  // same distributed CSS bundle via dist alias
```

Version helpers are exported from both the root and runtime entries:

```js
import { SLEXKIT_VERSION, SLEX_PROTOCOL_VERSION, getSlexKitInfo } from "slexkit";
```

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

## Obsidian plugin

The official Obsidian plugin lives in a separate release repository: <https://github.com/slexkit/obsidian-slexkit>.

Install it through Community Plugins once listed, or use BRAT/manual GitHub release assets before listing.

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
| Obsidian plugin | Community Plugins, BRAT, or manual release assets from `slexkit/obsidian-slexkit` |
| AI agent MCP server | `npx -y @slexkit/mcp` |

## v0 packaging strategy

The current approach keeps the root `slexkit` package as the real code carrier. Scoped `@slexkit/*` wrappers exist to define future package boundaries. If physical package splitting happens in the future, it will involve splitting source code, build output, and publishing workflows.

## Release quality gate

All scoped packages are release-checked together:

```sh
bun run build
bun run test
bun run smoke:release
```

The release smoke packs and installs every scoped package in this repository, verifies public entry points, verifies CSS subpath exports, and starts the MCP stdio binary to check `initialize`, `tools/list`, and `slexkitValidate`.
