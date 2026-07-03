---
title: 包与安装
category: Reference
status: ready
order: 60
summary: "SlexKit npm 包的角色、安装组合、发布内容和 release 检查。"
slexkitRenderMode: component
---

# 包与安装

这一页列出 SlexKit v0/beta 的 npm 包、安装方式和发布检查。

## 包映射

```txt
slexkit (root package)
 ├── runtime entry
 ├── Svelte component registrations
 ├── ToolHost
 ├── default styles
 └── secure iframe runner

 @slexkit/runtime            re-exports slexkit/runtime
 @slexkit/components-svelte  re-exports slexkit/components-svelte
 @slexkit/theme-shadcn       CSS only
 @slexkit/streamdown         React/Streamdown renderer
 @slexkit/assistant-ui       assistant-ui Streamdown text wrapper
 @slexkit/tiptap             framework-free Tiptap NodeView adapter
 @slexkit/mcp                read-only MCP server for AI agents
```

`@slexkit/runtime` 和 `@slexkit/components-svelte` 是实际发布的 npm 包，但代码封装在根包之上，不是独立实现包。安装它们仍然需要安装 `slexkit`。`@slexkit/theme-shadcn` 只包含 CSS，没有 runtime implementation。

## `slexkit` root

主要实现包。包含 runtime engine、官方 Svelte components、ToolHost 和 styles。

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

`slex validate --standard` 会用随包发布的 validator 运行内置 Slex conformance fixtures。CI 或 agent 消费时使用 `--json`。

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

公开组件规格覆盖 action (1)、component (1)、content (6)、data (1)、disclosure (2)、display (3)、feedback (2)、input (6)、layout (4)、navigation (1)、tooling (3)。

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

## `@slexkit/assistant-ui`

assistant-ui message text wrapper，用于把 `@assistant-ui/react-streamdown` 中的 `slex` language block 替换为 SlexKit artifact。thread、message、composer、runtime 和 tool UI 仍由 assistant-ui 处理。

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

未显式设置时使用 secure runtime。assistant-ui tool calls 和 ToolHost 仍走各自的接入层。

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

这个扩展只接管语言等于 `slex` 的块，普通 code block 仍走 Tiptap 原生渲染。未显式设置时使用 trusted Markdown runtime host；需要 Markdown 导入/导出时安装并启用 `@tiptap/markdown`。

## Obsidian 插件

官方 Obsidian 插件位于独立发布仓库：<https://github.com/slexkit/obsidian-slexkit>。

普通 vault 使用直接从 Obsidian Community Plugins 安装 **SlexKit**。BRAT 或手动 GitHub release assets 主要用于测试 `slexkit/obsidian-slexkit` 中尚未发布的构建。

社区插件标记为 desktop-only，兼容 Obsidian 1.5.0+。

插件按用户本地 vault 内容处理，使用 trusted runtime mode。不要把它当作第三方或 agent-generated Markdown 的 sandbox；v0 adapter 不包含 secure sandbox support。

## `@slexkit/mcp`

给 AI agents 使用的 read-only MCP server。它提供生成后的 LLM docs、component metadata、examples、runtime docs、ToolHost docs 和 Slex source validation。

```sh
npx -y @slexkit/mcp
```

该 server 不修改项目文件。Agent 需要 SlexKit component 或 runtime context 时使用。

## 安装矩阵

| 使用场景 | 安装命令 |
|----------|----------------|
| 快速开始，包含所有内置能力 | `npm install slexkit` |
| 无组件运行时，自定义组件集 | `npm install slexkit @slexkit/runtime` |
| 使用官方 Svelte 组件 | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` |
| 添加 shadcn token 主题 | `npm install @slexkit/theme-shadcn` |
| React / Streamdown 宿主 | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` |
| assistant-ui 宿主 | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown @slexkit/assistant-ui @assistant-ui/react @assistant-ui/react-streamdown streamdown react react-dom` |
| Tiptap 编辑器宿主 | `npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown` |
| Obsidian 插件 | 从 Obsidian Community Plugins 安装 **SlexKit** |
| AI agent MCP 服务 | `npx -y @slexkit/mcp` |

## v0 包布局

v0 版本由 root `slexkit` 包承载主要实现。Scoped `@slexkit/*` 包负责提供更明确的安装入口；如果以后拆成物理包，source code、build output 和 publish workflows 需要一起拆分。

## 发布检查

发布前一起检查所有 scoped packages：

```sh
bun run build
bun run test
bun run lint
bun run smoke:release
npm pack --dry-run --json
slex validate --standard --json
```

Release smoke 会 pack 并安装 workspace 中的 scoped packages，验证 public entry points、CSS subpath exports，运行已安装的 `slex validate --standard --json`，并检查 MCP stdio binary 的 `initialize`、`tools/list` 和 `slexkitValidate`。

发布前检查 `npm pack --dry-run --json` 是否包含 `dist/standard/*` 和 `scripts/cli.mjs`。Standard artifacts 必须匹配 `package.json`、`SLEX_PROTOCOL_VERSION` 和内置 conformance fixtures。
