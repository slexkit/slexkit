---
title: 包与安装
category: Reference
status: ready
order: 60
summary: "SlexKit npm 包的用途、安装组合、发布内容与发布前检查。"
slexkitRenderMode: component
---

# 包与安装

SlexKit v0/beta npm 包之间的关系和安装方式。

## 包映射

```txt
slexkit (root package)
 ├── runtime entry
 ├── Svelte component registrations
 ├── ToolHost
 ├── default styles
 └── secure iframe runner

 @slexkit/runtime            重新导出 slexkit/runtime
 @slexkit/components-svelte  重新导出 slexkit/components-svelte
 @slexkit/theme-shadcn       只包含 CSS
 @slexkit/streamdown         React/Streamdown renderer
 @slexkit/tiptap             framework-free Tiptap NodeView adapter
 @slexkit/mcp                面向 AI agents 的只读 MCP server
```

`@slexkit/runtime` 和 `@slexkit/components-svelte` 是实际发布的 npm 包，但实现复用根包，不是独立实现包。安装它们仍然需要安装 `slexkit`。`@slexkit/theme-shadcn` 只包含 CSS，没有 runtime implementation。

## `slexkit` root

主实现包。包含 runtime engine、官方 Svelte components、ToolHost 和 styles。

```sh
npm install slexkit
```

```js
import { mount, disposeNamespace, boot } from "slexkit";
import "slexkit/style.css";
```

`slexkit/dist/style.css` 是同一份发布 CSS 的兼容 alias；不要和 `slexkit/style.css` 同时导入。

版本 helper 从 root 和 runtime entries 都导出：

```js
import { SLEXKIT_VERSION, SLEX_PROTOCOL_VERSION, getSlexKitInfo } from "slexkit";
```

根包也提供 `slex` CLI：

```sh
slex copy-runtime public/slexkit.runtime.js
slex validate ./artifact.slex --mode secure
slex validate --standard
```

`slex validate --standard` 会用当前 validator 运行内置 Slex conformance fixtures。CI 或 agent 消费时使用 `--json`。

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

公开组件规格覆盖 action (2)、component (1)、content (6)、data (1)、disclosure (2)、display (3)、feedback (2)、input (6)、layout (4)、navigation (1)、tooling (1)。

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

## `@slexkit/tiptap`

Tiptap extension，用于把显式 `slex` code block 渲染成 SlexKit preview，同时保留普通 fenced code block 的 Markdown 导入/导出行为。

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

这个 adapter 扩展 Tiptap 的 `CodeBlock`，只接管语言严格等于 `slex` 的块，普通 code block 仍走 Tiptap 原生渲染。默认使用 trusted Markdown runtime host；需要 Markdown 导入/导出时安装并启用 `@tiptap/markdown`。

## Obsidian 插件

官方 Obsidian 插件位于独立发布仓库：<https://github.com/slexkit/obsidian-slexkit>。

普通 vault 使用直接从 Obsidian Community Plugins 安装 **SlexKit**。BRAT 或手动 GitHub release assets 主要用于测试 `slexkit/obsidian-slexkit` 中尚未发布的构建。

当前社区插件为 desktop-only，兼容 Obsidian 1.5.0+。移动端支持应在真实 mobile vault 测试通过后再开启。

该 adapter 使用 trusted runtime mode，因为它渲染本地 vault 内容。它不用于隔离第三方或 agent-generated Markdown；v0 adapter 不包含 secure sandbox support。

## `@slexkit/mcp`

用于 AI agents 的 read-only MCP server。它提供生成后的 LLM docs、component metadata、examples、runtime docs、ToolHost docs 和 Slex source validation。

```sh
npx -y @slexkit/mcp
```

该 server 不修改项目文件。Agent 需要当前 SlexKit component 或 runtime context 时使用。

## 安装组合

| 场景 | 安装命令 |
|----------|----------------|
| 快速开始，包含默认运行时和组件 | `npm install slexkit` |
| 无组件运行时，自定义组件 | `npm install slexkit @slexkit/runtime` |
| 使用官方 Svelte 组件 | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` |
| 添加 shadcn 主题 | `npm install @slexkit/theme-shadcn` |
| React/Streamdown 宿主 | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` |
| Tiptap 编辑器宿主 | `npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown` |
| Obsidian plugin | 从 Obsidian Community Plugins 安装 **SlexKit** |
| AI agent MCP 服务 | `npx -y @slexkit/mcp` |

## 打包说明

v0 阶段由 root `slexkit` 包承载实现代码。Scoped `@slexkit/*` packages 提供不同入口和宿主适配；如果未来拆成物理包，需要同步拆分 source code、build output 和 publish workflows。

## 发布检查

所有 scoped packages 一起做 release check：

```sh
bun run build
bun run test
bun run lint
bun run smoke:release
npm pack --dry-run --json
slex validate --standard --json
```

Release smoke 会 pack 并安装 scoped packages，验证 public entry points、CSS subpath exports，运行已安装的 `slex validate --standard --json`，以及检查 MCP stdio binary 的 `initialize`、`tools/list` 和 `slexkitValidate`。

发布前检查 `npm pack --dry-run --json` 是否包含 `dist/standard/*` 和 `scripts/cli.mjs`。Standard artifacts 必须匹配 `package.json`、`SLEX_PROTOCOL_VERSION` 和内置 conformance fixtures。
