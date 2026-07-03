---
title: 宿主集成
category: Reference
status: ready
order: 40
summary: "MarkdownRuntimeHost、trusted/secure 宿主接入、Svelte 自定义宿主、Streamdown、Tiptap、Obsidian 与自定义 adapter。"
slexkitRenderMode: component
---

# 宿主集成

把 SlexKit 接入 Markdown renderers、chat hosts、document viewers 和 custom platforms 的方法。

## 核心概念

### Artifact（文档片段组）

Artifact 是属于同一文档、消息或笔记的一组 Slex blocks。宿主用 `artifactId` 标识 artifact，并把相关 blocks 分组到同一个 runtime domain。

Trusted mode 下，runtime 会用 artifact ID 前缀化每个 block 的 namespace，避免跨文档状态污染。`disposeArtifact()` 会释放该 artifact 下的 namespace stores。

Secure mode 下，同一个 artifact 的所有 fences 会合并进一个 sandbox iframe。Runtime 维护 artifact slots，并把渲染高度同步回原 Markdown placeholder containers。

### Block（单个渲染块）

Block 是单个 Slex block，即一个可渲染单元。它包含：

- Source：Slex expression object 或 source string。
- Container element：渲染输出位置。
- 可选 `artifactId`：用于分组到 artifact。

### Cleanup（清理）

每次 block mount 都返回 cleanup function。Block 被移除时宿主必须调用它。Artifact-level cleanup 调用 `disposeArtifact(artifactId)`；全局清理调用 `disposeAll()`。

## MarkdownRuntimeHost

`SlexKitMarkdownRuntimeHost` 是 Markdown 宿主推荐 API。它处理 mode selection、artifact management 和 block lifecycle。

```ts
import {
  createSlexKitMarkdownRuntimeHost,
  getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHost
} from "slexkit";
```

### 接口

```ts
type SlexKitMarkdownRuntimeHost = {
  configure(options: Partial<SlexKitMarkdownRuntimeOptions>): void;
  getMode(): "trusted" | "secure";
  mountBlock(block: SlexKitMarkdownBlock): () => void;
  disposeBlock(container: HTMLElement): void;
  disposeArtifact(artifactId: string): void;
  disposeAll(): void;
};
```

`SlexKitMarkdownBlock` 包含 `artifactId`、`blockId`、`source`、`container`、`stateOnly`、`theme`、`dir`、`labels`、`executionMode`。`SlexKitMarkdownRuntimeOptions` 包含 `mode`、`policy`、`hostAdapter`、`secureFrame`、`theme`、`dir`、`labels`、`executionMode`。

### 全局 singleton

模块提供一个 global singleton：

```ts
const runtime = installSlexKitMarkdownRuntimeHost({
  mode: "secure",
  policy: { execution: { maxUnresponsiveMs: 30000 } },
  secureFrame: { runtimeUrl: "/slexkit.runtime.js" }
});

const runtime = getSlexKitMarkdownRuntimeHost();
```

当整个应用共享一套 runtime configuration 时使用 singleton。不同 host contexts 需要不同 policies 时，应创建独立 host。

## Trusted mode 接入

Trusted mode 在宿主页 realm 运行 Slex source。适用于本地文档、应用生成内容或已审查 source。

```ts
const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "trusted",
  theme: "host-shadcn"
});

const cleanup = runtime.mountBlock({
  artifactId: "doc-1",
  source: fenceSource,
  container: fenceContainer
});

runtime.disposeBlock(fenceContainer);
runtime.disposeArtifact("doc-1");
runtime.disposeAll();
```

Trusted mode 会自动用 artifact ID scope namespaces，例如 `<artifactId>::<namespace>`，避免不同文档污染彼此状态。

State-only blocks（无 `layout`，只有 `g` 更新）会自动通过 `ingest()` 导入。后续同 artifact 的 renderable blocks 可以读取这些状态。

## Secure mode 接入

Secure mode 在 sandbox iframe 中运行 Slex source。适用于不可信或 agent-generated Markdown。

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

省略的 capability policies 默认拒绝访问。只有宿主明确启用时才添加 `network`、`timer`、`animation` 或 `canvas` policy objects。

### Artifact slot 桥接

同一 secure artifact 中的多个 blocks 共享一个 sandbox iframe。第一个 block 作为 iframe anchor，其他 blocks 作为 slots；slot containers 接收来自 sandbox 的 position 和 height 更新。

```html
<div id="fence-1"><!-- anchor: iframe rendered here --></div>
<div id="fence-2"><!-- slot: height synced from iframe --></div>
<div id="fence-3"><!-- slot: height synced from iframe --></div>
```

这样 fence 之间可以共享状态，同时所有执行仍限制在同一个 sandbox 中。

### `runtimeUrl` 要求

`runtimeUrl` 必须把 SlexKit runtime 作为 ES module 提供，并返回：

```txt
Access-Control-Allow-Origin: *
Content-Type: text/javascript
```

Build output 包含 `dist/runtime.js`。`slex copy-runtime` 命令默认复制到 `public/slexkit.runtime.js`，便于保持 secure-frame URL 稳定。

## Svelte 自定义 Markdown 宿主

SlexKit 官网使用 Svelte 和自定义 Markdown renderer，而不是一个独立发布的 Svelte Markdown adapter。公开契约仍然是 `createSlexKitMarkdownRuntimeHost`；Svelte 部分属于宿主代码。

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

宿主拥有自己的 Markdown AST 或 Svelte renderer 时，可以把这个作为实现参考。不要把 `site/markdown/*` 当成单独版本化的包 API。

## Streamdown / React 接入

`@slexkit/streamdown` 提供 React/Streamdown custom renderer：

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

该 renderer 处理 `slex` fences，支持 trusted 和 secure runtime modes，也可以委托给 shared Markdown runtime host instance。

流式输出时，trusted renderer 默认使用 `streaming="repair"`：完整可解析源码会直接挂载；只缺 EOF 闭合符的前缀会以 preview 模式挂载；无法确定的前缀继续显示 placeholder；明确语法错误仍显示 diagnostics。`streaming="stable"` 只渲染已经可解析的前缀，`streaming={false}` 会等待 closing fence。Secure runtime 和 secure runtime host 不会在宿主 realm 执行 repaired prefix。

## Tiptap 接入

`@slexkit/tiptap` 提供 framework-free Tiptap `CodeBlock` extension：

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

这个 adapter 只接管 `language === "slex"` 的 `codeBlock` node。非 Slex code block 保持普通 Tiptap code block；通过 Tiptap Markdown extension 导入/导出时，标准 ` ```slex ` fence 会保留。

每个 editor 实例默认拥有一个 trusted Markdown runtime host。该 editor 中的 block 共享 artifact ID，因此 state-only fence 可以为后续可渲染 fence 提供状态。宿主需要显式生命周期控制时，可以传入 `runtimeHost` 或 `artifactId`。

## Obsidian 接入

官方 Obsidian 插件位于 <https://github.com/slexkit/obsidian-slexkit>，它注册 `slex` fenced code block processor：

```ts
registerMarkdownCodeBlockProcessor("slex", (source, el, ctx) => { ... });
```

Adapter 只在 reading mode 渲染，不写回 vault。同一 note 内的 blocks 共享 trusted artifact runtime。

重要：Obsidian adapter 使用 trusted mode，因为它渲染本地 vault 内容。它不提供不可信或 agent-generated Markdown 的 sandbox 隔离。

## 编写自定义宿主 adapter

### 1. 识别 fence language

只处理语言标记为 `slex` 的 fences。不要扫描 plain JavaScript、JSON 或 untagged code blocks。

### 2. 创建 runtime host

```ts
import { createSlexKitMarkdownRuntimeHost } from "slexkit";

const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "trusted",
  theme: "host-shadcn"
});
```

### 3. 挂载 blocks

为每个 fence 创建 container，并挂载：

```ts
function processFence(source: string, fenceIndex: number) {
  const container = document.createElement("div");
  const cleanup = runtime.mountBlock({
    artifactId: "message-42",
    source,
    container
  });

  return cleanup;
}
```

### 4. 管理生命周期

```ts
runtime.disposeBlock(container);
runtime.disposeArtifact("message-42");
runtime.disposeAll();
```

### 5. 处理 secure mode

使用 secure mode 时，`slexkit.runtime.js` 需要作为 public ES module 提供，并配置 `secureFrame.runtimeUrl`。

## Fallback 渲染

支持 SlexKit 的宿主仍应在 DOM 中保留 raw fence content 或 plain text fallback，以便不支持 SlexKit 的环境可读。Runtime 会替换 container children，因此 fallback 只在 mount 前或 disposal 后可见。
