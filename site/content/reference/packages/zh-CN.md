---
title: 包边界
category: Reference
status: ready
order: 60
summary: "Package 关系、安装矩阵、发布内容与 release quality gate。"
slexkitRenderMode: component
---

# 包边界

SlexKit v0/beta npm packages 之间的关系和安装方式。

## Package relationship

```txt
slexkit (root - real code)
 ├── runtime entry
 ├── Svelte component registrations
 ├── ToolHost
 ├── default styles
 └── secure iframe runner

 @slexkit/runtime            re-exports slexkit/runtime
 @slexkit/components-svelte  re-exports slexkit/components-svelte
 @slexkit/theme-shadcn       CSS only
 @slexkit/streamdown         React/Streamdown renderer
 @slexkit/obsidian           Obsidian plugin
 @slexkit/mcp                read-only MCP server for AI agents
```

`@slexkit/runtime` 和 `@slexkit/components-svelte` 是根包的 thin wrapper，不是独立实现包。安装它们仍然需要安装 `slexkit`。`@slexkit/theme-shadcn` 只包含 CSS，没有 runtime implementation。

## `slexkit` root

真实实现包。包含 runtime engine、官方 Svelte components、ToolHost 和 styles。

```sh
npm install slexkit
```

```js
import { mount, disposeNamespace, boot } from "slexkit";
import "slexkit/style.css";
import "slexkit/dist/style.css";
```

版本 helper 从 root 和 runtime entries 都导出：

```js
import { SLEXKIT_VERSION, SLEX_PROTOCOL_VERSION, getSlexKitInfo } from "slexkit";
```

## `@slexkit/runtime`

无组件 runtime entry，不会自动注册官方 Svelte components。

```sh
npm install slexkit @slexkit/runtime
```

```js
import { mount, register, createSecureRuntime } from "@slexkit/runtime";
```

当宿主要注册自己的组件集，而不是使用 bundled Svelte components 时使用。

## `@slexkit/components-svelte`

Side-effect import，用于把所有官方 Svelte components 注册到 runtime registry。

```sh
npm install slexkit @slexkit/runtime @slexkit/components-svelte
```

```js
import { mount } from "@slexkit/runtime";
import "@slexkit/components-svelte";
```

公开组件规格覆盖 action、content、data、disclosure、display、feedback、input、layout、navigation、tooling 等分类。

## `@slexkit/theme-shadcn`

CSS theme bundle，兼容 shadcn/ui tokens。

```sh
npm install @slexkit/theme-shadcn
```

```js
import "@slexkit/theme-shadcn/style.css";
```

## `@slexkit/streamdown`

React/Streamdown custom renderer，用于 Markdown-hosted Slex fences。

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

它只处理 `slex` fences，并支持 trusted 与 secure runtime modes。

## `@slexkit/obsidian`

Obsidian plugin adapter。它注册 SlexKit fenced code block processor，在 reading mode 渲染本地 vault 内容。

```sh
npm install slexkit @slexkit/obsidian
```

该 adapter 使用 trusted runtime mode，因为它渲染用户本地 vault 内容，不设计为第三方或 agent-generated Markdown 的 sandbox。Obsidian secure sandbox support 不属于 v0 adapter 范围。

## `@slexkit/mcp`

面向 AI agents 的 read-only MCP server。它提供生成后的 LLM docs、component metadata、examples、runtime docs、ToolHost docs 和 Slex source validation。

```sh
npx -y @slexkit/mcp
```

该 server 不修改项目文件。Agent 需要当前 SlexKit component 或 runtime context 时使用。

## Installation matrix

| Use case | Install command |
|----------|----------------|
| Quick start, everything included | `npm install slexkit` |
| Component-free, custom components | `npm install slexkit @slexkit/runtime` |
| With Svelte components | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` |
| Add shadcn theme | `npm install @slexkit/theme-shadcn` |
| React/Streamdown host | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` |
| Obsidian plugin | `npm install slexkit @slexkit/obsidian` |
| AI agent MCP server | `npx -y @slexkit/mcp` |

## v0 packaging strategy

当前策略是让 root `slexkit` 包承载真实代码。Scoped `@slexkit/*` wrappers 用来定义未来包边界。如果未来拆成物理包，需要同步拆分 source code、build output 和 publish workflows。

## Release quality gate

所有 scoped packages 一起做 release check：

```sh
bun run build
bun run test
bun run smoke:release
```

Release smoke 会 pack 并安装所有 scoped package，验证 public entry points、CSS subpath exports、Obsidian CJS bundle，以及 MCP stdio binary 的 `initialize`、`tools/list` 和 `slexkitValidate`。
